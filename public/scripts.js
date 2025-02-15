// const $ = document.querySelector.bind(document);
const sectionBtn = document.getElementById('btn');
console.log(sectionBtn)
// sectionBtn.addEventListener('click', (e)=>{
    
// })

if(sectionBtn.innerText === "LOG IN"){
    document.documentElement.setAttribute('section', 'sign-up')
}else{
    document.documentElement.removeAttribute('section')
}