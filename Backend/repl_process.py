from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os

from Backend.repl_env import REPLEnv
from Backend.repl_env.prompts import (
    RLM_SYSTEM_PROMPT,
    QueryMetadata,
    build_rlm_system_prompt,
    build_user_prompt,
    extract_code_blocks,
    format_observation,
)
from openai import OpenAI


load_dotenv() 
HF_TOKEN=os.getenv("HF_TOKEN")
SPACE_URL = os.getenv("SPACE_URL")
MODEL_NAME = os.getenv("MODEL_NAME")
DATASET_SUBSET = os.getenv("DATASET_SUBSET")
DATASET_SPLIT = os.getenv("DATASET_SPLIT")
EXAMPLE_INDEX = os.getenv("EXAMPLE_INDEX")
MAX_ITERATIONS = int(os.getenv("MAX_ITERATIONS"))




def llm_chat(messages: list[dict]):
    """
    LLM function for chat-style messages (outer loop),
    using OpenRouter.
    """
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY"),
    )
    response = client.chat.completions.create(
        model="openai/gpt-4.1-nano",
        messages=messages,
        max_tokens=2048,
        temperature=0.7,
    )
    return response.choices[0].message.content, response.usage.model_dump()


def local_llm_query(prompt: str) -> str:
    return llm_chat([{"role": "user", "content": prompt}])

def local_llm_batch(prompts: list[str]) -> list[str]:
    return [local_llm_query(p) for p in prompts]


def rlm_chat(context, task_prompt):
    env = REPLEnv(llm_query_fn=local_llm_query, llm_batch_fn=local_llm_batch)
    result = env.reset(
        context=context,
        task_prompt=task_prompt,
        max_iterations=MAX_ITERATIONS,
        hf_token=HF_TOKEN,  # Server will use this token for sub-LLM calls
    )
    obs = result.observation


    query_metadata = QueryMetadata(
        context_lengths=[obs.context_length],
        context_total_length=obs.context_length,
        context_type="str",
    )

    messages = build_rlm_system_prompt(RLM_SYSTEM_PROMPT, query_metadata)
    messages.append(build_user_prompt(root_prompt=task_prompt, iteration=0))

    # RLM loop
    final_answer = None
    code_and_output = messages.copy()

    for i in range(1, MAX_ITERATIONS + 1):
        print(f"\n--- Iteration {i} ---")

        response, usage = llm_chat(messages)
        print(f"LLM: {response[:400]}{'...' if len(response) > 400 else ''}")

        code_blocks = extract_code_blocks(response)
        if not code_blocks:
            messages.append({"role": "assistant", "content": response})
            messages.append({"role": "user", "content": "Please provide code in ```repl``` blocks."})

            code_and_output.append({"role": "assistant", "content": response, "usage": usage})
            code_and_output.append({"role": "user", "content": "Please provide code in ```repl``` blocks."})            
            continue

        for code in code_blocks:
            print(f"\nExecuting:\n{code[:300]}{'...' if len(code) > 300 else ''}")

            # Execute code - same API for both local and remote!
            result = env.execute(code)
            obs = result.observation

            print(f"Success: {obs.result.success}")
            print(f"Env iteration: {obs.iteration}/{obs.max_iterations}")
            if obs.result.stdout:
                print(f"Output: {obs.result.stdout[:300]}{'...' if len(obs.result.stdout) > 300 else ''}")
            if obs.result.stderr:
                print(f"Stderr: {obs.result.stderr[:200]}")

            if result.done:
                state = env.state()
                final_answer = state.final_answer
                if final_answer:
                    print(f"\n=== FINAL answer detected ===")
                else:
                    print(f"\n=== Environment terminated (max iterations) ===")
                break

        if result.done:
            break  # Exit outer loop when env is done (with or without answer)

        # Add assistant response and observation + next user prompt
        messages.append({"role": "assistant", "content": response})
        observation_text = format_observation(obs)
        next_prompt = build_user_prompt(root_prompt=task_prompt, iteration=i)
        messages.append({"role": "user", "content": observation_text + "\n\n" + next_prompt["content"]})

        code_and_output.append({"role": "assistant", "content": response, "usage": usage, "code_blocks": code_blocks})
        code_and_output.append({"role": "user", "content": observation_text + "\n\n" + next_prompt["content"], "code_blocks_observed": observation_text})
        
    # Cleanup
    env.close()

    return final_answer, code_and_output