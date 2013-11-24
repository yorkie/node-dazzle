
process.title = 'Dazzle Worker';
process.constants = process.env._Dazzle;

process.on('message', function () {
  
})

console.log(JSON.stringify(process.constants, null, 2));