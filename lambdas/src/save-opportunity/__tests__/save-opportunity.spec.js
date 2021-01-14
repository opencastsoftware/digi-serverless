import {saveOpp} from '../save-opportunity';

let event;

beforeEach(()=>{
    event = {};
})

describe('save-opportunity',()=>{
    it('should return the right result',async ()=>{
        const result = await saveOpp(event);
        expect(result.statusCode).toEqual(200);
    })
})
