// ============================================
// La Bibliothèque d'Inès - Application JavaScript
// ============================================

// Récupération des éléments du DOM
const bookForm = document.getElementById('book-form');
const booksList = document.getElementById('books-list');
const emptyMessage = document.getElementById('empty-message');
const bookCount = document.getElementById('book-count');
const btnSearch = document.getElementById('btn-search');
const searchStatus = document.getElementById('search-status');
const coverPreview = document.getElementById('cover-preview');
const bookCoverImg = document.getElementById('book-cover');
const coverUrlInput = document.getElementById('cover-url');

// ============================================
// RECHERCHE DE LIVRE (Google Books API)
// ============================================

// Fonction pour rechercher un livre sur Google Books
async function searchBook() {
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();

    // Vérification qu'au moins le titre est renseigné
    if (!title) {
        searchStatus.textContent = '⚠️ Entre au moins le titre du livre !';
        searchStatus.className = 'search-status error';
        return;
    }

    // Construction de la requête de recherche
    let query = title;
    if (author) {
        query += '+inauthor:' + author;
    }

    // Afficher le statut de recherche
    searchStatus.textContent = '🔍 Recherche en cours...';
    searchStatus.className = 'search-status';
    btnSearch.disabled = true;

    try {
        // Appel à l'API Google Books (gratuite, sans clé API)
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=fr&maxResults=1`);
        const data = await response.json();

        if (data.totalItems > 0 && data.items && data.items.length > 0) {
            const book = data.items[0].volumeInfo;

            // Remplir le résumé si disponible et si le champ est vide
            const summaryField = document.getElementById('summary');
            if (book.description && !summaryField.value) {
                // Limiter le résumé à 500 caractères
                let summary = book.description;
                if (summary.length > 500) {
                    summary = summary.substring(0, 500) + '...';
                }
                // Retirer les balises HTML du résumé
                summary = summary.replace(/<[^>]*>/g, '');
                summaryField.value = summary;
            }

            // Afficher la couverture si disponible
            if (book.imageLinks && (book.imageLinks.thumbnail || book.imageLinks.smallThumbnail)) {
                const coverUrl = (book.imageLinks.thumbnail || book.imageLinks.smallThumbnail).replace('http:', 'https:');
                bookCoverImg.src = coverUrl;
                coverUrlInput.value = coverUrl;
                coverPreview.style.display = 'block';
            } else {
                coverPreview.style.display = 'none';
                coverUrlInput.value = '';
            }

            // Remplir l'auteur si non renseigné
            const authorField = document.getElementById('author');
            if (book.authors && book.authors.length > 0 && !authorField.value) {
                authorField.value = book.authors.join(', ');
            }

            searchStatus.textContent = '✅ Livre trouvé ! Résumé et couverture ajoutés.';
            searchStatus.className = 'search-status success';
        } else {
            searchStatus.textContent = '❌ Aucun livre trouvé. Vérifie l\'orthographe ou ajoute l\'auteur.';
            searchStatus.className = 'search-status error';
            coverPreview.style.display = 'none';
        }
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        searchStatus.textContent = '❌ Erreur de connexion. Réessaie plus tard.';
        searchStatus.className = 'search-status error';
    }

    btnSearch.disabled = false;
}

// Événement du bouton de recherche
btnSearch.addEventListener('click', searchBook);

// ============================================
// GESTION DE LA BASE DE DONNÉES (Firebase Firestore)
// ============================================

// Fonction pour récupérer les livres depuis Firebase
async function getBooks() {
    try {
        const snapshot = await booksCollection.orderBy('createdAt', 'desc').get();
        const books = [];
        snapshot.forEach(doc => {
            books.push({ id: doc.id, ...doc.data() });
        });
        return books;
    } catch (error) {
        console.error('Erreur lors de la récupération des livres:', error);
        return [];
    }
}

// Fonction pour ajouter un livre dans Firebase
async function addBook(book) {
    try {
        book.date = new Date().toLocaleDateString('fr-FR');
        book.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        const docRef = await booksCollection.add(book);
        book.id = docRef.id;
        return book;
    } catch (error) {
        console.error('Erreur lors de l\'ajout du livre:', error);
        throw error;
    }
}

// Fonction pour supprimer un livre de Firebase
async function deleteBook(bookId) {
    try {
        await booksCollection.doc(bookId).delete();
    } catch (error) {
        console.error('Erreur lors de la suppression du livre:', error);
        throw error;
    }
}

// ============================================
// AFFICHAGE DES LIVRES
// ============================================

// Fonction pour créer les étoiles de notation
function createStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '★'; // Étoile pleine
        } else {
            stars += '☆'; // Étoile vide
        }
    }
    return stars;
}

// Fonction pour créer une carte de livre
function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.dataset.id = book.id;

    // Création du HTML avec ou sans couverture
    const coverHtml = book.coverUrl ?
        `<div class="book-card-cover">
            <img src="${escapeHtml(book.coverUrl)}" alt="Couverture de ${escapeHtml(book.title)}">
        </div>` : '';

    card.innerHTML = `
        <button class="btn-delete" onclick="handleDelete('${book.id}')" title="Supprimer ce livre">✕</button>
        <div class="book-card-content">
            ${coverHtml}
            <div class="book-card-info">
                <h3>${escapeHtml(book.title)}</h3>
                ${book.author ? `<p class="author">par ${escapeHtml(book.author)}</p>` : ''}
                <div class="rating">${createStars(book.rating)}</div>
                ${book.summary ? `
                    <p class="summary">
                        <span class="summary-label">📖 Résumé :</span> ${escapeHtml(book.summary)}
                    </p>
                ` : ''}
                <p class="comment">
                    <span class="comment-label">💭 Mon avis :</span> ${escapeHtml(book.comment)}
                </p>
                <p class="date">Ajouté le ${book.date}</p>
            </div>
        </div>
    `;

    return card;
}

// Fonction pour échapper les caractères HTML (sécurité)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Fonction pour afficher tous les livres
async function displayBooks() {
    // Afficher un indicateur de chargement
    booksList.innerHTML = '<p class="loading-message">⏳ Chargement des livres...</p>';

    const books = await getBooks();

    // Vider la liste
    booksList.innerHTML = '';

    // Mettre à jour le compteur
    bookCount.textContent = `(${books.length})`;

    if (books.length === 0) {
        // Afficher le message si aucun livre
        booksList.innerHTML = '<p class="empty-message">Aucun livre pour le moment. Ajoute ton premier livre ! 📚</p>';
    } else {
        // Afficher chaque livre
        books.forEach(book => {
            const card = createBookCard(book);
            booksList.appendChild(card);
        });
    }
}

// ============================================
// GESTION DES ÉVÉNEMENTS
// ============================================

// Soumission du formulaire
bookForm.addEventListener('submit', async function(event) {
    event.preventDefault(); // Empêche le rechargement de la page

    // Récupérer les valeurs du formulaire
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const summary = document.getElementById('summary').value.trim();
    const comment = document.getElementById('comment').value.trim();
    const coverUrl = document.getElementById('cover-url').value;
    const ratingInput = document.querySelector('input[name="rating"]:checked');

    // Vérification que la note est sélectionnée
    if (!ratingInput) {
        alert('N\'oublie pas de donner une note au livre ! ⭐');
        return;
    }

    const rating = parseInt(ratingInput.value);

    // Créer l'objet livre
    const newBook = {
        title: title,
        author: author,
        summary: summary,
        comment: comment,
        rating: rating,
        coverUrl: coverUrl
    };

    try {
        // Ajouter le livre dans Firebase
        await addBook(newBook);

        // Réafficher la liste
        await displayBooks();

        // Réinitialiser le formulaire
        bookForm.reset();

        // Cacher la prévisualisation de la couverture
        coverPreview.style.display = 'none';
        searchStatus.textContent = '';

        // Message de confirmation
        alert('📚 Livre ajouté avec succès !');
    } catch (error) {
        alert('❌ Erreur lors de l\'ajout du livre. Réessaie plus tard.');
    }
});

// Fonction pour gérer la suppression (accessible globalement)
async function handleDelete(bookId) {
    if (confirm('Es-tu sûre de vouloir supprimer ce livre ?')) {
        try {
            await deleteBook(bookId);
            await displayBooks();
        } catch (error) {
            alert('❌ Erreur lors de la suppression. Réessaie plus tard.');
        }
    }
}

// ============================================
// INITIALISATION
// ============================================

// Afficher les livres au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    displayBooks();
});
