

const sendMessageResult = jest.fn().mockResolvedValue(true);

const AWS = {
  SQS: jest.fn(()=>{}),
  config: {
    update: jest.fn(),
  }
};

AWS.SQS.prototype = {
  sendMessage: jest.fn(()=>{
    return {
      promise: sendMessageResult,
    }
  })
}


export default AWS;
