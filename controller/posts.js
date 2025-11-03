document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("posts-container");

    // Lê o arquivo JSON
    fetch("../controller/posts.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro ao carregar posts.json");
            }
            return response.json();
        })
        .then(data => {
            // percorre e cria cada post
            data.posts.forEach(post => {
                const postDiv = document.createElement("div");
                postDiv.classList.add("post");

                postDiv.innerHTML = `
                    <img class="post-img" src="${post.img}" alt="${post.empresa}">
                    <p class="legenda_post">
                        <strong>${post.id}. 💻 ${post.empresa}</strong><br><br>
                        <strong>Local:</strong> ${post.local}<br><br>
                        <strong>Tipo:</strong> ${post.tipo}<br><br>
                        <strong>Descrição:</strong> ${post.descricao}<br><br>
                        <strong>Requisitos:</strong><br>
                        ${post.requisitos.map((req, i) => `${i + 1}) ${req}`).join("<br>")}
                    </p>
                    <div class="inscreva-btn">
                        <a target="_blank" class="inscreva-se" href="${post.link}">INSCREVA-SE</a>
                    </div>
                `;

                container.appendChild(postDiv);
            });
        })
        .catch(error => console.error(error));
});
