// helper.jsx client
// Redo to better fit my app 
const handleError = (message) => {
  document.getElementById('errorMessage').textContent = message;
  document.getElementById('notification').classList.remove('hidden');
}; 
  
/* Sends post requests to the server using fetch. Will look for various
    entries in the response JSON object, and will handle them appropriately.
*/
const sendPost = async (url, data, handler) => {
  const isFormData = data instanceof FormData;
 
  const response = await fetch(url, {
    method: 'POST',
    // Let the browser set Content-Type automatically for FormData
    // (it needs to include the multipart boundary)
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? data : JSON.stringify(data),
  });
 
  const result = await response.json();
  document.getElementById('notification').classList.add('hidden');
 
  if (result.redirect) {
    window.location = result.redirect;
  }
 
  if (result.error) {
    handleError(result.error);
  }
 
  if (handler) {
    handler(result);
  }
};
 
const hideError = () => {
  document.getElementById('notification').classList.add('hidden');
};
 
module.exports = {
  handleError,
  sendPost,
  hideError,
};