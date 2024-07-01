// Defining a function called formatDate
export function formatDate() {
  const dateOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };
  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-US', dateOptions);
  return formattedDate;
};

// Defining a function called formatDateDisplay which takes a dateString parameter
export const formatDateDisplay = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
};