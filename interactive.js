document.addEventListener("DOMContentLoaded", function() {
    const header = document.getElementById("header");
    const texts = ["Web Developer", "Automation Expert", "Software Developer"];
    let index = 0;
    let charIndex = 0;
    let currentText = texts[index];

    function typeText() {
        if (charIndex < currentText.length) {
            header.textContent += currentText.charAt(charIndex);
            charIndex++;
            setTimeout(typeText, 100); // Typing speed
        } else {
            charIndex = 0;
            index++;
            if (index < texts.length) {
                currentText = texts[index];
                setTimeout(() => {
                    header.textContent = "";
                    typeText();
                }, 2000); // Delay before typing the next word
            }
        }
    }

    typeText();


    // Image change effect
    const profilePic = document.getElementById("profilePic");
    const images = ["IVCC.png", "ISU Graduate.png", "rocketClub.png"];
    let imgIndex = 0;

    function changeImage() {
        imgIndex++;
        if (imgIndex >= images.length) {
            imgIndex = 0;
        }
        profilePic.src = images[imgIndex];
    }

    setInterval(changeImage, 10000); // Change image every 3 seconds
});