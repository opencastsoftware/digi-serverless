const moment = require('moment');

module.exports.saveOpp = async event => {
    console.log(moment.utc());
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: 'Go Serverless v1.0! Your function executed successfully!',
          input: event,
        },
        null,
        2
      ),
    };
};
