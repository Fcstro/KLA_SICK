
// Camera access with error handling
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({video: true})
        .then(stream => {
            document.getElementById("cam").srcObject = stream;
        })
        .catch(err => {
            console.log("Camera access denied:", err);
            document.getElementById("cam").style.display = "none";
        });
} else {
    console.log("Camera API not available");
    document.getElementById("cam").style.display = "none";
}

function selectChar(){
    fetch('/select-character',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({character:document.getElementById('char').value})
    })
    .then(response => response.json())
    .then(data => {
        console.log("Character selected:", data);
    })
    .catch(err => {
        console.error("Error selecting character:", err);
    });
}

// Location tracking with error handling
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(pos => {
        fetch('/update-location',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({lat:pos.coords.latitude, lon:pos.coords.longitude})
        }).then(r=>r.json()).then(d=>{
            if(d.spawn){
                document.getElementById('enemy').innerHTML =
                    `<button onclick="attack('${d.enemy}')">Attack ${d.enemy}</button>`;
            }
        });
    }, err => {
        console.log("Location access denied:", err);
    });
} else {
    console.log("Geolocation not available");
}

function attack(enemy){
    fetch('/attack',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({enemy})
    }).then(r=>r.json()).then(d=>{
        document.getElementById('log').innerText = JSON.stringify(d,null,2);
    });
}
