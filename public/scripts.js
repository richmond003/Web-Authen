const sectionBtn = document.getElementById('btn-grid');

// Grid secction condition
if(sectionBtn.innerText === "LOG IN"){
    document.documentElement.setAttribute('section', 'sign-up')
}else{
    document.documentElement.removeAttribute('section')
}

const form = document.getElementById("register-form");

const mixmatch = document.getElementById('mixmatch-msg');

form.addEventListener("submit", e =>{
    const password = document.getElementById("password");
    const verPassword = document.getElementById("verPassword");
    console.log(password);
    console.log(verPassword);

    if (password.value.trim() === verPassword.value.trim()){
        console.log("send over");
        verPassword.removeAttribute("class", "mixmatch-password")
    }else{
        console.log("prevent send over");
        verPassword.setAttribute("class", "mixmatch-password");
        mixmatch.innerHTML += "<p>Password didn't match</p>"
        e.preventDefault();
    }
})
