Bangla News Text Classifier — Experimental Demo

Files:
- bangla_news_text_model.joblib
- model_metadata.json

Input:
- A string containing Bangla news article content.

Output:
- 0 = authentic_label
- 1 = fake_label

Important:
This model predicts labels used by its training dataset. It does
not independently verify facts or guarantee that an article is
true or false. Satire, clickbait, source differences and label
quality may affect its predictions. Do not present the output as
a verified fact-check result.

The model is intended for an academic prototype and error analysis.
