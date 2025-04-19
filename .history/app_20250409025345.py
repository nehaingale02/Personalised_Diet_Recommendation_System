from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
from scipy.linalg import eig
import seaborn as sns
import matplotlib.pyplot as plt
import os

app = Flask(__name__,
            template_folder='templates',
            static_folder='static')

# Load the dataset
try:
    df = pd.read_csv('static/data/final_modified_dataset.csv')
except FileNotFoundError:
    print("Error: Dataset file not found. Please ensure the file exists at static/data/final_modified_dataset.csv")
    df = pd.DataFrame()  # Create empty DataFrame as fallback

# Prepare features for cosine similarity
if not df.empty:
    features = ['Dosha_Numeric', 'Suitable_for_Encoded', 'Type_of_Dish_Encoded']
    X = df[features]
    scaler = MinMaxScaler()
    X_normalized = scaler.fit_transform(X)

# Define AHP computation function
def compute_ahp_weights(matrix):
    eigvals, eigvecs = eig(matrix)
    max_index = np.argmax(eigvals.real)
    weights = eigvecs[:, max_index].real
    weights /= weights.sum()
    return weights

# Disease-specific AHP matrices
ahp_matrices = {
    'Heart Disease': np.array([
        [1, 4, 5, 2, 4, 1],
        [1/4, 1, 3, 1/2, 2, 1/2],
        [1/5, 1/3, 1, 1/4, 1, 1/3],
        [1/2, 2, 4, 1, 3, 1],
        [1/4, 1/2, 1, 1/3, 1, 1/2],
        [1, 2, 3, 1, 2, 1]
    ]),
    'Diabetes': np.array([
        [1, 2, 1, 1/2, 1/4, 2],
        [1/2, 1, 1/2, 1/3, 1/5, 1],
        [1, 2, 1, 1/2, 1/3, 2],
        [2, 3, 2, 1, 1/2, 3],
        [4, 5, 3, 2, 1, 4],
        [1/2, 1, 1/2, 1/3, 1/4, 1]
    ]),
    'Obesity': np.array([
        [1, 3, 2, 3, 3, 2],
        [1/3, 1, 1/2, 2, 2, 1],
        [1/2, 2, 1, 2, 2, 1],
        [1/3, 1/2, 1/2, 1, 1, 1/2],
        [1/3, 1/2, 1/2, 1, 1, 1/2],
        [1/2, 1, 1, 2, 2, 1]
    ]),
    'Hypertension': np.array([
        [1, 3, 4, 2, 3, 2],
        [1/3, 1, 2, 1, 2, 1],
        [1/4, 1/2, 1, 1/2, 1, 1/2],
        [1/2, 1, 2, 1, 2, 1],
        [1/3, 1/2, 1, 1/2, 1, 1/2],
        [1/2, 1, 2, 1, 2, 1]
    ]),
    'Acidity': np.array([
        [1, 2, 2, 3, 4, 2],
        [1/2, 1, 1, 2, 3, 1],
        [1/2, 1, 1, 2, 2, 1],
        [1/3, 1/2, 1/2, 1, 2, 1/2],
        [1/4, 1/3, 1/2, 1/2, 1, 1/3],
        [1/2, 1, 1, 2, 3, 1]
    ])
}

# Default matrix (for 'None')
default_matrix = np.ones((6, 6))

# Get weights based on disease
def get_disease_specific_weights(disease):
    matrix = ahp_matrices.get(disease, default_matrix)
    return compute_ahp_weights(matrix)

# Mapping
dosha_map = {'kapha': 3.0, 'vata': 1.0, 'pitta': 2.0}
disease_map = {'Heart Disease': 1, 'Obesity': 5, 'Diabetes': 6, 'Hypertension': 15, 'Acidity': 11, 'None': None}
dish_type_map = {'Main Course': 2, 'Salad': 3, 'Side Dish': 5, 'Soup': 4, 'Dessert': 1, 'Curry': 6, 'Snack': 7}

# Dish recommendation function
def recommend_dishes(dosha, disease, dish_type, top_n=5):
    try:
        dosha_encoded = dosha_map[dosha.lower()]
        dish_type_encoded = dish_type_map[dish_type]
    except KeyError:
        return pd.DataFrame()

    weights = get_disease_specific_weights(disease)

    if disease == 'None' or disease_map[disease] is None:
        features_no_disease = ['Dosha_Numeric', 'Type_of_Dish_Encoded']
        X_no_disease = df[features_no_disease]
        scaler_no_disease = MinMaxScaler()
        X_normalized_no_disease = scaler_no_disease.fit_transform(X_no_disease)

        user_vector = scaler_no_disease.transform([[dosha_encoded, dish_type_encoded]])
        cosine_sim = cosine_similarity(user_vector, X_normalized_no_disease)

        df['Similarity'] = cosine_sim[0]
        recommendations = df.sort_values('Similarity', ascending=False).head(top_n)
    else:
        disease_encoded = disease_map[disease]
        filtered_df = df[df['Suitable_for_Encoded'] == disease_encoded].copy()
        if filtered_df.empty:
            return pd.DataFrame()

        user_vector = scaler.transform([[dosha_encoded, disease_encoded, dish_type_encoded]])
        cosine_sim = cosine_similarity(user_vector, scaler.transform(filtered_df[features]))

        filtered_df['Similarity'] = cosine_sim[0]
        recommendations = filtered_df.sort_values('Similarity', ascending=False).head(top_n)

    # Apply AHP score to recommendations
    recommendations['AHP_Score'] = np.dot(
        recommendations[['CholesterolContent', 'SaturatedFatContent', 'SodiumContent',
                         'CarbohydrateContent', 'SugarContent', 'ProteinContent']],
        weights
    )

    # Re-sort based on AHP score if needed
    recommendations = recommendations.sort_values(['Similarity', 'AHP_Score'], ascending=[False, False])

    return recommendations[['Dish Name', 'Recipe Steps', 'Ingredients', 'Calories (per 100g)', 'Similarity', 'AHP_Score']]

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/signup')
def signup():
    return render_template('signup.html')

@app.route('/bmi')
def bmi():
    return render_template('BMI.html')

@app.route('/diet-planner')
def diet_planner():
    return render_template('Diet Planner.html')

@app.route('/dosha-quiz')
def dosha_quiz():
    return render_template('Dosha Quiz.html')

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    user_dosha = data.get('dosha')
    user_disease = data.get('disease', 'None')
    user_dish_type = data.get('dish_type')
   
    recommendations = recommend_dishes(user_dosha, user_disease, user_dish_type, top_n=5)
   
    if recommendations.empty:
        return jsonify({'message': 'No matching dishes found. Please try different inputs.', 'data': []})
   
    result = recommendations.to_dict(orient='records')
    return jsonify({'message': 'Success', 'data': result})

if __name__ == '__main__':
    app.run(debug=True)