const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_KEY || 'sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912';
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.fillout.com/v1/api/forms';

app.use(express.json());

app.get('/', async (req, res) => {
  try {
    res.json(`Server Up and Running on port: ${PORT}`);
  } catch (error) {
    // Handle errors
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to start server' });
  }
});

// Route for fetching filtered responses
app.get('/:formId/filteredResponses', async (req, res) => {
  try {
    const { formId } = req.params;
    if (!formId) {
      return res.status(400).json({ error: 'formId is required' });
    }

    let parsedFilters;

    if (req?.query?.filters) {
      parsedFilters = JSON.parse(req.query.filters);
    }

    const apiUrl = `${API_BASE_URL}/${formId}/submissions`;

    const response = await axios.get(apiUrl, {
      params: req.query,
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    const responseData = response.data;

    if (parsedFilters?.length) {
      const rep = await filterResponses(responseData.responses, parsedFilters);
      const newresponseData = { ...responseData, responses: rep };
      res.json(newresponseData);
    }
    else
      res.json(responseData);
  } catch (error) {
    console.log(error)
    // Handle errors
    // console.error('Error fetching filtered responses:', error);
    res.status(500).json({
      error: 'Failed to fetch filtered responses'
    });
  }
});

function filterResponses(responses, parsedFilters) {
  return new Promise((resolve, reject) => {
    try {
      const filteredResponses = responses.filter(response => {
        for (const filter of parsedFilters) {
          const question = response.questions.find(q => q.id === filter.id);
          if (!question) return false;

          switch (filter.condition) {
            case 'equals':
              if (question.value !== filter.value) return false;
              break;
            case 'does_not_equal':
              if (question.value === filter.value) return false;
              break;
            case 'greater_than':
              if (!(new Date(question.value) > new Date(filter.value))) return false;
              break;
            case 'less_than':
              if (!(new Date(question.value) < new Date(filter.value))) return false;
              break;
            default:
              return false;
          }
        }
        return true;
      });
      resolve(filteredResponses);
    } catch (error) {
      reject(error);
    }
  });
}


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
