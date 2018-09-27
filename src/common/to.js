/** Simplifies error handling with async/await */
export default function to(promise) {
  return promise
    .then(data => [null, data])
    .catch(err => [err]);
}
