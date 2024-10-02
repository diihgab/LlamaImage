document.getElementById('uploadForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const formData = new FormData();
  const imageInput = document.getElementById('imageInput');
  
  if (imageInput.files.length === 0) {
    alert("Por favor, selecione uma imagem!");
    return;
  }

  formData.append('image', imageInput.files[0]);

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erro no upload da imagem');
    }

    const data = await response.json();
    document.getElementById('responseOutput').textContent = JSON.stringify(data.message, null, 2);
  } catch (error) {
    console.error('Erro:', error);
    document.getElementById('responseOutput').textContent = 'Erro ao processar a imagem.';
  }
});
