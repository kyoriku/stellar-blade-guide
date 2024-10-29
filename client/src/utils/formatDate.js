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
// export const formatDateDisplay = (dateString) => {
//   return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
// };

// Defining a function called formatDateDisplay which takes a dateString parameter
export const formatDateDisplay = (dateString) => {
  const date = new Date(dateString);

  // Format the date part
  const formattedDate = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Format the time part
  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: 'numeric', // Removes leading zero
    minute: '2-digit',
    hour12: true, // Change to false for 24-hour format
  });

  // Combine date and time
  return `${formattedDate} ${formattedTime}`;
};
