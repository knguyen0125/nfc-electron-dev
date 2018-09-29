/**
 * Simplifies error handling with async/await
 * Prevent needing to wrap try/catch block around each async/await
*/
export default function to(promise) {
  return promise
    .then(data => [null, data])
    .catch(err => [err]);
}
