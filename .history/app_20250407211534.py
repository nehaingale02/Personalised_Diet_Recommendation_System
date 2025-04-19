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

# Create Flask app with explicit template and static folders
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

    # Normalize the features
    scaler = MinMaxScaler()
    X_normalized = scaler.fit_transform(X)

    # Define AHP Pairwise Comparison Matrix
    pairwise_matrix = np.array([
        [1, 3, 5, 2, 4, 3],
        [1/3, 1, 3, 1/2, 2, 1],
        [1/5, 1/3, 1, 1/4, 1/2, 1/3],
        [1/2, 2, 4, 1, 3, 2],
        [1/4, 1/2, 2, 1/3, 1, 1/2],
        [1/3, 1, 3, 1/2, 2, 1]
    ])

    # Compute AHP Weights
    eigvals, eigvecs = eig(pairwise_matrix)
    max_index = np.argmax(eigvals.real)
    weights = eigvecs[:, max_index].real
    weights /= weights.sum()

    # Compute AHP Score for each dish
    df['AHP_Score'] = np.dot(df[['CholesterolContent', 'SaturatedFatContent', 'SodiumContent', 
                                'CarbohydrateContent', 'SugarContent', 'ProteinContent']], weights)

# Dish recommendation function
def recommend_dishes(dosha, diseases, dish_type, top_n=5):
    if df.empty:
        return pd.DataFrame()
        
    dosha_map = {'kapha': 3.0, 'vata': 1.0, 'pitta': 2.0}
    disease_map = {'Heart Disease': 1, 'Obesity': 5, 'Diabetes': 6, 'Hypertension': 15, 'Acidity': 11, 'None': 8}
    dish_type_map = {'Main Course': 2, 'Salad': 3, 'Side Dish': 5, 'Soup': 4, 'Dessert': 1, 'Curry': 6, 'Snack': 7}
    
    try:
        dosha_encoded = dosha_map[dosha.lower()]
        dish_type_encoded = dish_type_map[dish_type]
    except KeyError:
        return pd.DataFrame()

    # Handle 'None' disease case differently
    if "None" in diseases:
        # Only consider dosha and dish type for recommendations
        features_no_disease = ['Dosha_Numeric', 'Type_of_Dish_Encoded']
        X_no_disease = df[features_no_disease]
        scaler_no_disease = MinMaxScaler()
        X_normalized_no_disease = scaler_no_disease.fit_transform(X_no_disease)
        
        user_vector = scaler_no_disease.transform([[dosha_encoded, dish_type_encoded]])
        cosine_sim = cosine_similarity(user_vector, X_normalized_no_disease)
        
        df['Similarity'] = cosine_sim[0]
        recommendations = df.sort_values('Similarity', ascending=False).head(top_n)
    else:
        # Handle multiple diseases
        disease_encoded = [disease_map[d] for d in diseases]
        filtered_df = df[df['Suitable_for_Encoded'].isin(disease_encoded)].copy()
        
        if filtered_df.empty:
            return pd.DataFrame()
            
        user_vector = scaler.transform([[dosha_encoded, disease_encoded[0], dish_type_encoded]])
        cosine_sim = cosine_similarity(user_vector, scaler.transform(filtered_df[features]))
        filtered_df['Similarity'] = cosine_sim[0]
        recommendations = filtered_df.sort_values('Similarity', ascending=False).head(top_n)
    
    # Calculate final score combining similarity and AHP score
    recommendations['Final_Score'] = 0.6 * recommendations['Similarity'] + 0.4 * recommendations['AHP_Score']
    recommendations = recommendations.sort_values('Final_Score', ascending=False)
    
    return recommendations[['Dish Name', 'Recipe Steps', 'Ingredients', 'Calories (per 100g)', 'Similarity', 'AHP_Score', 'Final_Score']]

@app.route('/')
def home():
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
    try:
        data = request.get_json()
        user_dosha = data.get('dosha')
        user_diseases = data.get('diseases', ['None'])
        user_dish_type = data.get('dish_type')
        
        if not all([user_dosha, user_dish_type]):
            return jsonify({'message': 'Missing required parameters', 'data': []})
        
        recommendations = recommend_dishes(user_dosha, user_diseases, user_dish_type, top_n=5)
        
        if recommendations.empty:
            return jsonify({'message': 'No matching dishes found. Please try different inputs.', 'data': []})
        
        result = []
        for _, row in recommendations.iterrows():
            result.append({
                'name': row['Dish Name'],
                'recipe': row['Recipe Steps'],
                'ingredients': row['Ingredients'],
                'calories': float(row['Calories (per 100g)']),
                'similarity_score': round(row['Similarity'] * 100, 2)  # Only showing similarity score
            })
        
        return jsonify({'message': 'Success', 'data': result})
        
    except Exception as e:
        print(f"Error in recommendation: {str(e)}")
        return jsonify({'message': f'Error processing request: {str(e)}', 'data': []})

if __name__ == '__main__':
    app.run(debug=True)