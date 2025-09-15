function generateOutlookContent (matrixData) {
  // TODO: Implement sentence building logic using matrix data
  // This should analyze the matrix and create descriptive sentences
  // about flood risks for different time periods and sources

  if (!matrixData || matrixData.length === 0) {
    return 'The flood risk for the next 5 days is very low.'
  }

  // Placeholder for now - implement logic later
  return 'Outlook content generation in progress...'
}

module.exports = {
  generateOutlookContent
}
