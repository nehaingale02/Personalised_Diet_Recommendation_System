// ======= Back to Top Button =======
const backToTopBtn = document.querySelector('.back-to-top');

window.onscroll = () => {
    if (!backToTopBtn) return;
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        backToTopBtn.style.display = 'flex';
    } else {
        backToTopBtn.style.display = 'none';
    }
};

// ======= Top Navigation Menu Activation =======
const menuItems = document.getElementsByClassName('menu-item');

Array.from(menuItems).forEach(item => {
    item.onclick = () => {
        const currMenu = document.querySelector('.menu-item.active');
        if (currMenu) currMenu.classList.remove('active');
        item.classList.add('active');
    };
});

// ======= On Scroll Animation =======
const scroll = window.requestAnimationFrame || function(callback) {
    window.setTimeout(callback, 1000 / 60);
};

const elToShow = document.querySelectorAll('.play-on-scroll');

const isElInViewPort = (el) => {
    const rect = el.getBoundingClientRect();
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;

    return (
        (rect.top <= 0 && rect.bottom >= 0) ||
        (rect.bottom >= viewHeight && rect.top <= viewHeight) ||
        (rect.top >= 0 && rect.bottom <= viewHeight)
    );
};

const loop = () => {
    elToShow.forEach(item => {
        item.classList.toggle('start', isElInViewPort(item));
    });

    scroll(loop);
};

loop();

// ======= Mobile Navigation Bar =======
const bottomNavItems = document.querySelectorAll('.mb-nav-item');
const bottomMove = document.querySelector('.mb-move-item');

bottomNavItems.forEach((item, index) => {
    item.onclick = () => {
        const crrItem = document.querySelector('.mb-nav-item.active');
        if (crrItem) crrItem.classList.remove('active');
        item.classList.add('active');
        bottomMove.style.left = `${index * 25}%`;
    };
});

// ======= Recommendation Generator =======
async function getRecommendation() {
    // Get selected values
    const dosha = document.getElementById('dosha').value;
    const dishType = document.getElementById('dishType').value;
    
    // Get selected diseases
    const selectedDiseases = Array.from(document.querySelectorAll('input[name="disease"]:checked'))
        .map(checkbox => checkbox.value);
    
    // If no disease is selected, add "None"
    if (selectedDiseases.length === 0) {
        selectedDiseases.push("None");
    }

    // Prepare request data
    const requestData = {
        dosha: dosha,
        diseases: selectedDiseases,
        dish_type: dishType
    };

    try {
        // Show loading state
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = '<div class="loading">Loading recommendations...</div>';

        // Make API request
        const response = await fetch('/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (data.message === 'Success' && data.data.length > 0) {
            // Display recommendations
            let recommendationsHTML = '<div class="recommendations-container">';
            recommendationsHTML += '<h4>Recommended Dishes:</h4>';
            
            data.data.forEach((dish, index) => {
                recommendationsHTML += `
                    <div class="dish-recommendation">
                        <h5>${index + 1}. ${dish.name}</h5>
                        <div class="dish-details">
                            <p><strong>Calories:</strong> ${dish.calories} per 100g</p>
                            <p><strong>Ingredients:</strong> ${dish.ingredients}</p>
                            <p><strong>Recipe:</strong> ${dish.recipe}</p>
                            <p><strong>Similarity Score:</strong> ${dish.similarity_score}%</p>
                        </div>
                    </div>
                `;
            });
            
            recommendationsHTML += '</div>';
            resultDiv.innerHTML = recommendationsHTML;
        } else {
            resultDiv.innerHTML = '<div class="no-results">No recommendations found. Please try different criteria.</div>';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('result').innerHTML = '<div class="error">An error occurred. Please try again.</div>';
    }
}

// ======= FAQ Accordion Toggle =======
function toggleFAQ(index) {
    const contents = document.querySelectorAll(".faq-content");
    const icons = document.querySelectorAll(".icon");

    const content = contents[index];
    const icon = icons[index];

    const isOpen = content.style.display === "block";

    content.style.display = isOpen ? "none" : "block";
    icon.classList.toggle("open", !isOpen);
    icon.innerHTML = isOpen ? "+" : "−";
}

// Add event listener for the recommendation button
document.addEventListener('DOMContentLoaded', function() {
    const recommendButton = document.querySelector('button[onclick="getRecommendation()"]');
    if (recommendButton) {
        recommendButton.addEventListener('click', getRecommendation);
    }
});