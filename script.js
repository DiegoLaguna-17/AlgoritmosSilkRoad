document.addEventListener('DOMContentLoaded', () => {
    // Lógica del header
    const header = document.getElementById('main-header');
    let lastScrollTop = 0;
    const delta = 5;

    window.addEventListener('scroll', () => {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Check if scrolled enough to trigger header movement
        if (Math.abs(lastScrollTop - currentScrollTop) <= delta) {
            return;
        }

        // Determine scroll direction
        if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
            // Scrolling down and past hero section
            header.classList.add('header-hidden');
        } else if (currentScrollTop < lastScrollTop) {
            // Scrolling up
            header.classList.remove('header-hidden');
        }

        lastScrollTop = currentScrollTop;
    });

    // Lógica para el Intersección Observer (activar animaciones cuando las secciones estén visibles)
    const sections = document.querySelectorAll('section');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view'); // Aplica la clase in-view para activar animación
            } else {
                entry.target.classList.remove('in-view'); // Remueve la clase cuando la sección ya no está visible
            }
        });
    }, { threshold: 0.5 }); // Umbral de visibilidad (cuando el 50% de la sección está en el viewport)

    // Observar todas las secciones
    sections.forEach(section => {
        observer.observe(section);
    });

    // Lógica para el slider (sin cambios)
    let next = document.querySelector('.next');
    let prev = document.querySelector('.prev');

    next.addEventListener('click', function(){
        let items = document.querySelectorAll('.item');
        document.querySelector('.slide').appendChild(items[0]);
    });

    prev.addEventListener('click', function(){
        let items = document.querySelectorAll('.item');
        document.querySelector('.slide').prepend(items[items.length - 1]);
    });
    const slides = document.querySelectorAll('.slide .item');
    const prevBtn = document.querySelector('.button button:first-child');
    const nextBtn = document.querySelector('.button button:last-child');
    
    // Set initial active slide
    let currentSlide = 0;
    slides[currentSlide].classList.add('active');
    
    // Function to change slides
    function changeSlide(n) {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + n + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    }
    
    // Event listeners for buttons
    prevBtn.addEventListener('click', () => changeSlide(-1));
    nextBtn.addEventListener('click', () => changeSlide(1));
});
