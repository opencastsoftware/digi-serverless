import {saveOpp} from '../save-opportunity';

let event;

beforeEach(()=>{
    event = {};
})

describe('save-opportunity',()=>{
    it('should return the right result',()=>{
        const result = saveOpp(event);
        expect(result).toEqual('bob');
    })
})
