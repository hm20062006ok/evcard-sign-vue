<script setup>
import { ref, onMounted } from 'vue';
const BASE_URL = process.env.NODE_ENV === "development"
    ? `http://127.0.0.1:8787`
    : `https://evcard-sign-api.humiao2006.workers.dev`;
console.log("BASE_URL: ", BASE_URL )
// State
const tokens = ref([]);
const newToken = ref({ account_name: '', token: '' });
const editingToken = ref(null); // Holds the token being edited

// --- API Functions ---

// Fetch all tokens from the API
const fetchTokens = async () => {
  try {
    const response = await fetch(BASE_URL + '/api/tokens');
    if (!response.ok) throw new Error('Failed to fetch tokens');
    tokens.value = await response.json();
  } catch (error) {
    console.error('Error fetching tokens:', error);
    alert('Error fetching tokens. See console for details.');
  }
};

// Add a new token
const addToken = async () => {
  if (!newToken.value.account_name || !newToken.value.token) {
    alert('Account name and Token are required.');
    return;
  }
  try {
    const response = await fetch(BASE_URL + '/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newToken.value),
    });
    if (!response.ok) throw new Error('Failed to add token');
    newToken.value = { account_name: '', token: '' }; // Reset form
    await fetchTokens(); // Refresh list
  } catch (error) {
    console.error('Error adding token:', error);
    alert('Error adding token. See console for details.');
  }
};

// Update an existing token
const updateToken = async (tokenToUpdate) => {
  try {
    const response = await fetch(BASE_URL + `/api/tokens/${tokenToUpdate.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_name: tokenToUpdate.account_name,
            token: tokenToUpdate.token
          }),
        }
    );
    if (!response.ok) throw new Error('Failed to update token');
    editingToken.value = null; // Exit editing mode
    await fetchTokens(); // Refresh list
  } catch (error) {
    console.error('Error updating token:', error);
    alert('Error updating token. See console for details.');
  }
};

// Delete a token
const deleteToken = async (id) => {
  if (!confirm('Are you sure you want to delete this token?')) return;
  try {
    const response = await fetch(BASE_URL + `/api/tokens/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete token');
    await fetchTokens(); // Refresh list
  } catch (error) {
    console.error('Error deleting token:', error);
    alert('Error deleting token. See console for details.');
  }
};

// --- Helper Functions ---

// Enter editing mode for a token
const startEditing = (token) => {
  // Create a copy of the token to avoid mutating the original directly
  editingToken.value = { ...token };
};

// Manually trigger a sign-in for a token
const manualSignIn = async (id) => {
  try {
    const response = await fetch(BASE_URL + `/api/tokens/${id}/signin`, { method: 'POST' });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Sign-in request failed');
    }

    alert(`签到结果: ${result.message}`);
    await fetchTokens(); // Refresh list to show updated status
  } catch (error) {
    console.error('Error during manual sign-in:', error);
    alert(`签到失败: ${error.message}`);
  }
};


// Cancel editing mode
const cancelEditing = () => {
  editingToken.value = null;
};

// --- Lifecycle Hook ---

onMounted(() => {
  fetchTokens();
});
</script>

<template>
  <div id="app">
    <header>
      <h1>Token Manager</h1>
    </header>

    <main>
      <!-- Add Token Form -->
      <div class="form-container add-form">
        <h2>Add New Token</h2>
        <form @submit.prevent="addToken">
          <input
              v-model="newToken.account_name"
              placeholder="Account Name"
              required
          />
          <input
              v-model="newToken.token"
              placeholder="Token"
              required
          />
          <button type="submit">Add Token</button>
        </form>
      </div>

      <!-- Tokens List -->
      <div class="table-container">
        <h2>Existing Tokens</h2>
        <table>
          <thead>
          <tr>
            <th>ID</th>
            <th>Account Name</th>
            <th>Token</th>
            <th>Next Execution</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="token in tokens" :key="token.id">
            <!-- Viewing Mode -->
            <template v-if="!editingToken || editingToken.id !== token.id">
              <td data-label="ID">{{ token.id }}</td>
              <td data-label="Account Name">{{ token.account_name }}</td>
              <td data-label="Token" class="token-cell" :title="token.token"><span>{{ token.token }}</span></td>
              <td data-label="Next Execution">{{ new Date(token.next_execution_time).toLocaleString() }}</td>
              <td class="actions">
                <button @click="startEditing(token)" class="edit-btn">Edit</button>
                <button @click="manualSignIn(token.id)" class="signin-btn">Sign-in</button>
                <button @click="deleteToken(token.id)" class="delete-btn">Delete</button>
              </td>
            </template>
            <!-- Editing Mode -->
            <template v-else>
              <td data-label="ID">{{ editingToken.id }}</td>
              <td data-label="Account Name"><input v-model="editingToken.account_name" /></td>
              <td data-label="Token"><input v-model="editingToken.token" /></td>
              <td data-label="Next Execution">{{ new Date(token.next_execution_time).toLocaleString() }}</td>
              <td class="actions">
                <button @click="updateToken(editingToken)" class="save-btn">Save</button>
                <button @click="cancelEditing" class="cancel-btn">Cancel</button>
              </td>
            </template>
          </tr>
          <tr v-if="tokens.length === 0" class="no-hover">
            <td colspan="5">No tokens found.</td>
          </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  background-color: #f4f7f9;
  color: #333;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  margin-bottom: 2rem;
  text-align: center;
}

h1 {
  color: #2c3e50;
}

.form-container, .table-container {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

h2 {
  margin-bottom: 1.5rem;
  color: #34495e;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

form {
  display: flex;
  gap: 1rem;
  align-items: center;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.add-form {
  flex-wrap: wrap;
}

.add-form input {
  flex: 1 1 300px;
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  color: #fff;
  background-color: #3498db;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #2980b9;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th, td {
  padding: 1rem;
  border-bottom: 1px solid #ddd;
  vertical-align: middle;
}

td input {
  padding: 0.5rem;
}

thead th {
  background-color: #f9fafb;
  font-weight: 600;
}

.token-cell {
  max-width: 250px; /* 您可以根据需要调整此宽度 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help; /* 提示用户可以悬停查看完整内容 */
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.actions button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.edit-btn, .save-btn {
  background-color: #2ecc71;
}
.edit-btn:hover, .save-btn:hover {
  background-color: #27ae60;
}

.delete-btn, .cancel-btn {
  background-color: #e74c3c;
}
.delete-btn:hover, .cancel-btn:hover {
  background-color: #c0392b;
}

.signin-btn {
  background-color: #9b59b6;
}
.signin-btn:hover {
  background-color: #8e44ad;
}

/* --- Responsive Design for Mobile --- */
@media (max-width: 768px) {
  #app {
    padding: 1rem;
  }

  .form-container, .table-container {
    padding: 1.5rem 1rem;
  }

  h1 {
    font-size: 1.75rem;
  }

  h2 {
    font-size: 1.25rem;
  }

  /* Responsive Form */
  .add-form {
    flex-direction: column;
    align-items: stretch;
  }

  .add-form button {
    width: 100%;
  }

  /* Responsive Table to Card List */
  table {
    border: 0;
  }

  thead {
    /* Hide table header but keep it accessible */
    border: none;
    clip: rect(0 0 0 0);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    width: 1px;
  }

  tr {
    display: block;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 1.5rem;
    background: #fff;
  }
  tr.no-hover {
    box-shadow: none;
    background: transparent;
  }

  td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 1rem;
    border-bottom: 1px solid #f0f0f0;
    text-align: right;
  }

  tr td:last-child {
    border-bottom: 0;
  }

  td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #34495e;
    text-align: left;
    margin-right: 1rem;
  }

  td.token-cell {
    white-space: normal;
    word-break: break-all;
  }

  td.actions {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  td.actions::before {
    display: none; /* No label for actions */
  }

  .actions button {
    width: 100%;
    text-align: center;
  }
}
</style>
