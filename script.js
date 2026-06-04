const SUPABASE_URL = "https://ndlxnpicnqmqmmzueyfw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hqes6wBXjRRbjsserBXXGw_wZ5Xeiao";
const TABLE_NAME = "entries";

console.log("[Supabase Test] démarrage");
console.log({ SUPABASE_URL, SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? "set" : "empty" });

const supabaseClient = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("entry-form");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const itemsContainer = document.getElementById("items");
const status = document.getElementById("status");

if (!window.supabase) {
  console.error("Supabase CDN non chargé ou bloqué.");
}

if (!supabaseClient) {
  console.error("Supabase n'a pas pu être initialisé. Vérifie que le CDN se charge et que ton réseau le permet.");
  showStatus("Impossible de charger Supabase. Ouvre la console pour plus d'infos.", "error");
}

if (!form || !titleInput || !descriptionInput || !itemsContainer || !status) {
  console.error("Élément HTML manquant : form, title, description, items ou status.");
  showStatus("Erreur d'initialisation du formulaire.", "error");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  console.log("submit clicked");

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  console.log({ title, description });

  if (!title || !description) {
    showStatus("Merci de remplir les deux champs.", "error");
    return;
  }

  showStatus("Envoi en cours…", "info");

  try {
    const { error } = await supabaseClient
      .from(TABLE_NAME)
      .insert([{ title, description }]);

    if (error) {
      showStatus(`Erreur lors de l'enregistrement : ${error.message}`, "error");
      console.error(error);
      return;
    }

    titleInput.value = "";
    descriptionInput.value = "";
    showStatus("Enregistré avec succès !", "success");
    await loadItems();
  } catch (error) {
    showStatus(`Erreur inattendue : ${error.message || error}`, "error");
    console.error(error);
  }
});

async function loadItems() {
  if (!supabaseClient) {
    showStatus("Impossible de charger les entrées : client Supabase non disponible.", "error");
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select("id, title, description, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      showStatus(`Impossible de charger les entrées : ${error.message}`, "error");
      console.error(error);
      return;
    }

    if (!data || data.length === 0) {
      itemsContainer.innerHTML = "<p>Aucune entrée pour le moment.</p>";
      return;
    }

    itemsContainer.innerHTML = data
      .map(
        (entry) => `
      <article class="item">
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${escapeHtml(entry.description)}</p>
        <time>${new Date(entry.created_at).toLocaleString()}</time>
      </article>`
      )
      .join("");
  } catch (error) {
    showStatus(`Erreur réseau/technique : ${error.message || error}`, "error");
    console.error(error);
  }
}

showStatus("Application prête. Clique sur Envoyer.", "info");
loadItems();

function showStatus(message, type = "info") {
  status.textContent = message;
  status.className = `status ${type}`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
