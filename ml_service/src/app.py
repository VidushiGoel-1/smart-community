import pandas as pd
import streamlit as st

from predict import predict

st.set_page_config(page_title="Smart Community Moderation")
st.title("Smart Community: AI moderation demo")
st.caption("The model only suggests. A human moderator makes the final decision.")

if "history" not in st.session_state:
    st.session_state.history = []

text = st.text_area("Type a comment", height=100)

if st.button("Check") and text.strip():
    r = predict(text)

    if r["outcome"] == "allow":
        st.success("ALLOW")
    else:
        st.warning("HOLD for moderator review")

    col1, col2 = st.columns(2)
    col1.metric("Spam score", r["spam_score"])
    col2.metric("Flagged labels", ", ".join(r["flagged_labels"]) or "none")
    st.bar_chart(pd.Series(r["toxicity_scores"]))

    st.session_state.history.append({
        "comment": text[:80], "outcome": r["outcome"],
        "flagged": ", ".join(r["flagged_labels"]), "spam": r["is_spam"],
    })

if st.session_state.history:
    st.subheader("Review table")
    st.dataframe(pd.DataFrame(st.session_state.history[::-1]), use_container_width=True)