// 
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
    const dosha = document.getElementById("dosha").value;
    const dishType = document.getElementById("dishType").value;
    const selectedDisease = document.querySelector('input[name="disease"]:checked');
    const resultDiv = document.getElementById("result");

    if (!dosha || !dishType || !selectedDisease) {
        resultDiv.innerHTML = "<div class='error-message'>⚠️ Please select all required options.</div>";
        return;
    }

    try {
        resultDiv.innerHTML = "<div class='loading'>Loading recommendations...</div>";
        
        const response = await fetch('/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                dosha: dosha,
                disease: selectedDisease.value,
                dish_type: dishType
            })
        });

        const data = await response.json();
        
        if (data.message === 'Success' && data.data.length > 0) {
            let html = `<div class="recommendations-container">
                <h4>✅ Recommended Dishes:</h4>`;
            
            data.data.forEach((dish, index) => {
                const similarityPercent = Math.round(dish.Similarity * 100);
                html += `
                    <div class="dish-recommendation">
                        <h5>🍽️ Dish ${index + 1}: ${dish['Dish Name']}</h5>
                        <div class="dish-details">
                            <p><strong>🥘 Ingredients:</strong> ${dish.Ingredients}</p>
                            <p><strong>👨‍🍳 Recipe:</strong> ${dish['Recipe Steps']}</p>
                            <p><strong>🔥 Calories:</strong> ${dish['Calories (per 100g)']} per 100g</p>
                            <p><strong>🧠 Similarity Score:</strong> ${similarityPercent}%</p>
                        </div>
                    </div>`;
            });
            
            html += '</div>';
            resultDiv.innerHTML = html;
        } else {
            resultDiv.innerHTML = `<div class='no-results'>❌ ${data.message || "No recommendations found"}</div>`;
        }
    } catch (error) {
        console.error('Error:', error);
        resultDiv.innerHTML = `<div class='error'>⚠️ Error fetching recommendations: ${error.message}</div>`;
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


// Optional: Add event listeners dynamically instead of using inline onclicks
// Uncomment below if your HTML has .faq-question elements
// document.querySelectorAll(".faq-question").forEach((el, idx) => {
//     el.addEventListener("click", () => toggleFAQ(idx));
// });
