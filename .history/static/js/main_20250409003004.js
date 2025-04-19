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
function getRecommendation() {
    const dosha = document.getElementById("dosha").value;
    const dishType = document.getElementById("dishType").value;
    const diseases = Array.from(document.querySelectorAll('input[name="disease"]:checked')).map(cb => cb.value);
    const resultDiv = document.getElementById("result");

    if (!dosha || !dishType || diseases.length === 0) {
        resultDiv.innerText = "⚠️ Please select all required options.";
        return;
    }

    // Show loading state
    resultDiv.innerHTML = '<div class="loading">Loading recommendations...</div>';

    fetch("/recommend", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            dosha, 
            diseases, 
            dish_type: dishType 
        })
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        if (!data || !Array.isArray(data.data)) {
            throw new Error("Invalid response format");
        }

        if (data.data.length === 0) {
            resultDiv.innerHTML = `<div class="no-results">❌ ${data.message || "No recommendations found"}</div>`;
        } else {
            let output = `<div class="recommendations-container">
                <h4>✅ Recommended Dishes:</h4>`;
            
            data.data.forEach((dish, index) => {
                output += `
                    <div class="dish-recommendation">
                        <h5>🍽️ Dish ${index + 1}: ${dish.name || "N/A"}</h5>
                        <div class="dish-details">
                            <p><strong>🥘 Ingredients:</strong> ${dish.ingredients || "N/A"}</p>
                            <p><strong>👨‍🍳 Recipe:</strong> ${dish.recipe || "N/A"}</p>
                            <p><strong>🔥 Calories:</strong> ${dish.calories || "N/A"} per 100g</p>
                            <p><strong>🧠 Similarity Score:</strong> ${dish.similarity_score ? dish.similarity_score.toFixed(2) : "N/A"}%</p>
                        </div>
                    </div>`;
            });
            
            output += '</div>';
            resultDiv.innerHTML = output;
        }
    })
    .catch(err => {
        console.error("Error:", err);
        resultDiv.innerHTML = `<div class="error">⚠️ Error fetching recommendations: ${err.message}</div>`;
    });
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