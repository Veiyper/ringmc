/**
 * 
 * @param {any} data form data
 * @returns {{valid: boolean, errors: string[]}} validation result
 */
function validateForm(data) {
    if (!data.title || data.title.trim() === '') {
        return { valid: false, errors: ['Le titre est requis.'] };
    }

    if (!data.content || data.content.trim() === '') {
        return { valid: false, errors: ['Le contenu est requis.'] };
    }

    if (data.prices) {
        console.log(data.prices);
        try {
            const prices = JSON.parse(data.prices);
            if (!Array.isArray(prices)) {
                return { valid: false, errors: ['Les prix doivent être une liste.'] };
            }   
            for (const entry of prices) {
                if (typeof entry.item !== 'string' || typeof entry.value !== 'number') {
                    return { valid: false, errors: ['Chaque prix doit avoir un "item" de type chaîne et une "value" de type nombre.'] };
                }
            }
        } catch (e) {
            return { valid: false, errors: ['Les prix doivent être un JSON valide.'] };
        }
    }

    if (data.image_url && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/.test(data.image_url)) {
        return { valid: false, errors: ['L\'URL de l\'image doit être une URL valide pointant vers une image.'] };
    }

    if (data.category && data.category.trim() === '') {
        return { valid: false, errors: ['La catégorie ne peut pas être une chaîne vide.'] };
    }

    return { valid: true, errors: [] };
}

function postArticle(event) {
    event.preventDefault();

    const form = event.target;
    const pricesList = document.querySelector('.prices');
    const prices = pricesList.getAttribute('data-prices');
    const formData = new FormData(form);
    const data = {
        title: formData.get('title'),
        content: formData.get('content'),   
        category: formData.get('category'),
        prices: prices || [],
        image_url: formData.get('image'),
        author: formData.get('author')
    };

    const result = validateForm(data);
    if (!result.valid) {
        alert('Erreur de validation :\n' + result.errors.join('\n'));
        return;
    }

    data.prices = JSON.parse(data.prices);

    fetch('/articles', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(async response => {
        if (response.ok) {
            alert('Article publié avec succès !');
            form.reset();
            window.location.reload();
            return;
        }
        let message = 'Erreur lors de la publication de l\'article.';
        try {
            const body = await response.json();

            if (Array.isArray(body.error)) {
                const details = body.error.map((err) => {
                    const field = Array.isArray(err.loc) ? err.loc.join('.') : 'unknown';
                    const text = err.msg || JSON.stringify(err);
                    return '- ' + field + ' : ' + text;
                });
                message += '\n' + details.join('\n');
            } else if (typeof body.error === 'string') {
                message += '\n- ' + body.error;
            } else {
                message += '\n- ' + response.status + ' ' + response.statusText;
            }
        } catch {
            message += '\n- ' + response.status + ' ' + response.statusText;
        }

        alert(message);
    }).catch(error => {
        console.error('Error:', error);
        alert('Erreur lors de la publication de l\'article.');
    });
}

function init_price_input(addBtn, list, prices) {
    addBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.classList.add('price-entry');

        const itemInput = document.createElement('input');
        itemInput.type = 'text';
        itemInput.placeholder = 'Objet (ex: diamant)';
        itemInput.required = true;

        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.placeholder = 'Quantité';
        quantityInput.required = true;
        quantityInput.min = '1';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = '×';
        removeBtn.classList.add('btn', 'btn-danger', 'font-basic');

        div.appendChild(itemInput);
        div.appendChild(quantityInput);
        div.appendChild(removeBtn);
        list.appendChild(div);
        prices.push({ item: '', value: 0 });
        list.setAttribute('data-prices', JSON.stringify(prices));

        function updatePrice() {
            const index = Array.from(list.children).indexOf(div);
            prices[index] = { item: itemInput.value, value: parseInt(quantityInput.value) || 0 };
            list.setAttribute('data-prices', JSON.stringify(prices));
        }

        removeBtn.addEventListener('click', () => {
            const index = Array.from(list.children).indexOf(div);
            prices.splice(index, 1);
            div.remove();
            list.setAttribute('data-prices', JSON.stringify(prices));
        });

        itemInput.addEventListener('input', updatePrice);
        quantityInput.addEventListener('input', updatePrice);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('article-form');
    const openModalButtons = document.querySelectorAll('.open-modal');
    const actionButtons = document.querySelectorAll('.btn-action');
    const showPasswordBtn = document.querySelector('.show-password');
    const rickrollButton = document.querySelector('.block-button');
    const rickrollVideo = document.getElementById('rickroll');
    let playing = false;

    if (rickrollButton && rickrollVideo) {
        rickrollVideo.addEventListener('ended', () => {
            rickrollVideo.classList.remove('active');
            playing = false;
            rickrollVideo.currentTime = 0;
            rickrollVideo.pause();
        });

        rickrollVideo.addEventListener('click', (event) => {
            event.preventDefault();
        });

        rickrollVideo.addEventListener('pause', (event) => {
            if (playing) {
                event.preventDefault();
                rickrollVideo.currentTime = 0;
                rickrollVideo.play();
                playing = true;
            }
        });

        rickrollVideo.addEventListener('keypress', (event) => {
            event.preventDefault();
        });

        rickrollButton.addEventListener('click', () => {
            rickrollVideo.classList.add('active');
            rickrollVideo.currentTime = 0;
            rickrollVideo.play();
            playing = true;
        });
    }

    document.addEventListener('keydown', (event) => {
        if (playing) event.preventDefault();
    });
    document.querySelectorAll('a, button').forEach(link => {
        link.addEventListener('click', (event) => {
            if (playing) event.preventDefault();
        });
    });

    if (showPasswordBtn) {
        const passwordInput = showPasswordBtn.previousElementSibling;
        showPasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                showPasswordBtn.innerHTML = '<i class="nf nf-fa-eye_slash"></i>';
            } else {
                passwordInput.type = 'password';
                showPasswordBtn.innerHTML = '<i class="nf nf-fa-eye"></i>';
            }
        });
    }

    const addPriceBtn = document.getElementById('add-price-btn');
    const pricesList = document.querySelector('.prices');
    let prices = [];
    
    init_price_input(addPriceBtn, pricesList, prices);

    openModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-target');
            const modal = document.querySelector(`[data-name="${target}"]`);
            if (modal) {
                modal.classList.add('active');
            }

            function closeModal() {
                modal.classList.remove('active');
            }

            const closeActions = modal.querySelectorAll('.close-modal');
            closeActions.forEach(action => {
                action.addEventListener('click', closeModal);
            });

            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    closeModal();
                }
            });
        });
    });

    if (form) {
        form.addEventListener('submit', postArticle);
    }

    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-action');
            const articleId = button.getAttribute('data-id');

            switch (action) {
                case 'delete-article':
                    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
                        fetch(`/articles/${articleId}`, {
                            method: 'DELETE'
                        }).then(response => {
                            if (response.ok) {
                                alert('Article supprimé avec succès !');
                                window.location.reload();
                            } else {
                                if (response.status === 403) {
                                    alert('Vous n\'avez pas la permission de supprimer cet article.');
                                    return;
                                }
                                alert('Erreur lors de la suppression de l\'article.');
                            }
                        }).catch(error => {
                            console.error('Error:', error);
                            alert('Erreur lors de la suppression de l\'article.');
                        });
                    }
                    break;
                case 'delete-build':
                    if (confirm('Êtes-vous sûr de vouloir supprimer cette construction ?')) {
                        fetch(`/builds/${articleId}`, {
                            method: 'DELETE'
                        }).then(response => {                            if (response.ok) {
                                alert('Construction supprimée avec succès !');
                                window.location.reload();
                            } else {
                                if (response.status === 403) {
                                    alert('Vous n\'avez pas la permission de supprimer cette construction.');
                                    return;
                                }
                                alert('Erreur lors de la suppression de la construction.');
                            }
                        }).catch(error => {
                            console.error('Error:', error);
                            alert('Erreur lors de la suppression de la construction.');
                        });
                    }
                    break;
                default:
                    alert('Action inconnue : ' + action);
            }
        });
    });
});