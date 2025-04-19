// ======= Back to Top Button =======
const backToTopBtn = document.querySelector('.back-to-top');

if (backToTopBtn) {
    window.onscroll = () => {
        if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
            backToTopBtn.style.display = 'flex';
        } else {
            backToTopBtn.style.display = 'none';
        }
    };
}

// ======= Top Navigation Menu Activation =======
const menuItems = document.getElementsByClassName('menu-item');

if (menuItems.length > 0) {
    Array.from(menuItems).forEach(item => {
        item.onclick = () => {
            const currMenu = document.querySelector('.menu-item.active');
            if (currMenu) currMenu.classList.remove('active');
            item.classList.add('active');
        };
    });
}

// ======= On Scroll Animation =======
const scroll = window.requestAnimationFrame || function(callback) {
    window.setTimeout(callback, 1000 / 60);
};

const elToShow = document.querySelectorAll('.play-on-scroll');

if (elToShow.length > 0) {
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
            if (item) {
                item.classList.toggle('start', isElInViewPort(item));
            }
        });

        scroll(loop);
    };

    loop();
}

// ======= Mobile Navigation Bar =======
const bottomNavItems = document.querySelectorAll('.mb-nav-item');
const bottomMove = document.querySelector('.mb-move-item');

if (bottomNavItems.length > 0 && bottomMove) {
    bottomNavItems.forEach((item, index) => {
        item.onclick = () => {
            const crrItem = document.querySelector('.mb-nav-item.active');
            if (crrItem) crrItem.classList.remove('active');
            item.classList.add('active');
            bottomMove.style.left = `${index * 25}%`;
        };
    });
}

// ======= Recommendation Generator =======
function getRecommendation() {
    const dosha = document.getElementById("dosha")?.value;
    const dishType = document.getElementById("dishType")?.value;
    const diseases = Array.from(document.querySelectorAll('input[name="disease"]:checked')).map(cb => cb.value);
    const resultDiv = document.getElementById("result");

    if (!resultDiv) {
        console.error("Result div not found");
        return;
    }

    if (!dosha || !dishType || diseases.length === 0) {
        resultDiv.innerText = "⚠️ Please select all required options.";
        return;
    }

    // Send only one disease at a time — take the first selected
    const disease = diseases[0];

    fetch("/recommend", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ dosha, disease, dish_type: dishType })
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
            resultDiv.innerText = "❌ " + (data.message || "No recommendations found");
        } else {
            let output = `✅ Recommended Dishes:\n`;
            data.data.forEach((dish, index) => {
                if (dish) {
                    output += `\n🍽️ Dish ${index + 1}: ${dish["Dish Name"] || "N/A"}\n`;
                    output += `🥘 Ingredients: ${dish["Ingredients"] || "N/A"}\n`;
                    output += `👨‍🍳 Recipe: ${dish["Recipe Steps"] || "N/A"}\n`;
                    output += `🔥 Calories: ${dish["Calories (per 100g)"] || "N/A"}\n`;
                    output += `🧠 Similarity Score: ${dish["Similarity"] ? dish["Similarity"].toFixed(2) : "N/A"}\n`;
                    output += `🧬 Predicted Disease Category: ${dish["Predicted_Disease"] || "N/A"}\n`;
                    output += `----------------------------------\n`;
                }
            });
            resultDiv.innerText = output;
        }
    })
    .catch(err => {
        console.error("Error:", err);
        resultDiv.innerText = "⚠️ Error fetching recommendations. Please try again later.";
    });
}

// ======= FAQ Accordion Toggle =======
function toggleFAQ(index) {
    const contents = document.querySelectorAll(".faq-content");
    const icons = document.querySelectorAll(".icon");

    if (index >= contents.length || index >= icons.length) {
        console.error("Invalid FAQ index");
        return;
    }

    const content = contents[index];
    const icon = icons[index];

    if (!content || !icon) {
        console.error("FAQ elements not found");
        return;
    }

    const isOpen = content.style.display === "block";

    content.style.display = isOpen ? "none" : "block";
    icon.classList.toggle("open", !isOpen);
    icon.innerHTML = isOpen ? "+" : "−";
}

// Add event listeners for FAQ questions if they exist
document.addEventListener('DOMContentLoaded', () => {
    const faqQuestions = document.querySelectorAll(".faq-question");
    if (faqQuestions.length > 0) {
        faqQuestions.forEach((el, idx) => {
            el.addEventListener("click", () => toggleFAQ(idx));
        });
    }
}); 