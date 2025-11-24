
import streamlit as st
from typing import Dict

# Cache the chain objects to avoid re-importing/re-initializing on every rerun
@st.cache_resource
def get_chains():
    from core.chain import generation_chain, validation_chain, evaluation_chain
    return generation_chain, validation_chain, evaluation_chain

generation_chain, validation_chain, evaluation_chain = get_chains()

MAX_VALIDATION_ATTEMPTS = 3

if 'current_question' not in st.session_state:
    st.session_state.current_question = None
if 'question_count' not in st.session_state:
    st.session_state.question_count = 0
if 'interview_log' not in st.session_state:
    st.session_state.interview_log = []

def get_new_interview_question(difficulty: str) -> Dict | None:
    # Import inside function to reduce cold start
    for attempt in range(MAX_VALIDATION_ATTEMPTS):
        try:
            generated_q = generation_chain.invoke({
                "difficulty": difficulty
            })
            validation_result = validation_chain.invoke({
                "question_text": generated_q['question_text']
            })
            if validation_result['is_valid']:
                st.toast(f"Generated a new question (Attempt {attempt + 1})", icon="✅")
                return generated_q
            else:
                st.warning(f"Generated question was rejected. Reason: {validation_result['reasoning']}. Retrying...")
        except Exception as e:
            st.error(f"An error occurred during question generation/validation: {e}")
            continue
    st.error("Failed to generate a valid question after multiple attempts. Please try different parameters.")
    return None

st.set_page_config(layout="wide")
st.title("Dynamic AI Technical Interviewer")
st.markdown("This AI generates unique questions on the fly and evaluates your answers based on a detailed rubric.")

with st.sidebar:
    st.header("Interview Controls")
    difficulty = st.selectbox("Choose a difficulty:", ["Easy", "Medium", "Hard"])

    if st.button("Start New Interview / Get New Question"):
        st.session_state.current_question = get_new_interview_question(difficulty)
        st.session_state.question_count += 1

st.divider()

if not st.session_state.current_question:
    st.info("Click 'Start New Interview' in the sidebar to begin.")
else:
    current_q = st.session_state.current_question
    
    progress_text = f"Question #{st.session_state.question_count}"
    st.subheader(progress_text)
    st.info(f"**Difficulty:** {current_q['difficulty']}")
    st.header(current_q['question_text'])

    # Clear answer field when a new question is started
    if 'last_question_id' not in st.session_state or st.session_state.last_question_id != current_q.get('id', id(current_q)):
        st.session_state['user_answer'] = ''
        st.session_state['last_question_id'] = current_q.get('id', id(current_q))
    with st.form(key='answer_form'):
        user_answer = st.text_area("Your Answer:", height=250, placeholder="Provide a detailed, professional answer...", key='user_answer')
        submit_button = st.form_submit_button(label='Submit Answer for Evaluation')

    if submit_button and user_answer.strip():
        with st.spinner("AI is evaluating your answer..."):
            try:
                evaluation_result = evaluation_chain.invoke({
                    "question": current_q['question_text'],
                    "answer": user_answer
                })
                
                st.session_state.interview_log.append({
                    "question": current_q,
                    "answer": user_answer,
                    "feedback": evaluation_result
                })

                st.subheader("Evaluation Feedback")
                st.success(f"**Overall Assessment:** {evaluation_result['overall_assessment']}")
                
                col1, col2, col3 = st.columns(3)
                # Clamp scores to 0-5 and display as 0/5 to 5/5
                score_correctness = max(0, min(5, int(evaluation_result.get('score_correctness', 0))))
                score_efficiency = max(0, min(5, int(evaluation_result.get('score_efficiency', 0))))
                score_clarity = max(0, min(5, int(evaluation_result.get('score_clarity', 0))))
                col1.metric("Correctness", f"{score_correctness}/5", delta=None, delta_color="off")
                col2.metric("Efficiency", f"{score_efficiency}/5", delta=None, delta_color="off")
                col3.metric("Clarity", f"{score_clarity}/5", delta=None, delta_color="off")

                st.info(f"**Detailed Feedback:**\n\n{evaluation_result['feedback']}")

            except Exception as e:
                st.error(f"An error occurred during evaluation: {e}")
    elif submit_button:
        st.warning("Please provide an answer before submitting.")

if st.session_state.interview_log:
    st.divider()
    with st.expander("Show Full Interview History"):
        for i, log in enumerate(st.session_state.interview_log):
            st.write(f"**Q{i+1}: {log['question']['question_text']}**")
            st.write(f"**Your Answer:** {log['answer']}")
            st.success(f"**Assessment:** {log['feedback']['overall_assessment']}")
            st.write("---")
