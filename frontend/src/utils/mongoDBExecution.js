export const mongoDBExecution = async (query) => {
  try {
    const response = await fetch('http://localhost:5000/execute-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: query, // Send the command as it is
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.output || 'Failed to execute query');
    }

    return data.output; // Assuming your backend sends the output in this format
  } catch (error) {
    console.error('Error executing MongoDB command:', error); // Log the error to console
    throw new Error(error.message || 'An error occurred while executing the query');
  }
};
