const json = require('./build/contracts/Token.json');
let abi = json.abi;

abi = abi.filter(f => f.type === 'function');
abi.sort((a,b) => Number(a.constant) - Number(b.constant));
abi.forEach(f => {
    console.log(`h3. ${f.name}`);
    console.log();
    console.log(`* constant`);
    console.log(`** ${f.constant}`);
    console.log(`* input`);
    f.inputs.forEach(i => {
        console.log(`** ${i.name}`);
        console.log(`*** ${i.type}`);
    });
    console.log(`* output`);
    f.outputs.forEach(o => {
        console.log(`** ${o.name || '-'}`);
        console.log(`*** ${o.type}`);
    });
    console.log();
})