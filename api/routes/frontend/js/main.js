async function loadCourses() {
  try {
    const response = await fetch('http://localhost:3000/api/courses');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const courses = await response.json();
    
    const container = document.getElementById('courses-list');
    container.innerHTML = '';

    if (courses.length === 0) {
      container.innerHTML = '<p>Aucun cours trouvé</p>';
      return;
    }

    courses.forEach(course => {
      const card = document.createElement('div');
      card.className = 'bg-white p-6 rounded-lg shadow hover:shadow-lg transition';
      card.innerHTML = `
        <h3 class="text-xl font-bold mb-2">${course.title || 'Sans titre'}</h3>
        <p class="text-gray-600">${(course.description || '').substring(0, 100)}...</p>
        <p class="mt-4 font-semibold">${course.price ? course.price + ' €' : 'Gratuit'}</p>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Fetch error:', err);
    document.getElementById('courses-list').innerHTML = 
      `<p class="text-red-600 font-medium">Erreur : ${err.message}</p>`;
  }
}

// Exécuter quand la page est chargée
window.addEventListener('DOMContentLoaded', loadCourses);