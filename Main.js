// Dimensions de la scène
const wST = 500, hST = 700;
// Référence les textures
let textures;
// Référence les graphiques
let ground, pipe, bird, gameOver;
// Référence les rectangles pour les collisions
let rTop, rBottom;

// Déplacement oiseau accueil
let angle = 0, amplitude = 60;
// Vitesse déplacement en X
let vX = 3;
let vY = 0, acc = 5, impulsion = -25;
let phaseJeu = 0; // 0: accueil, 1:jeu, 2:gameOver

let ctrPaths = new PIXI.Container();
let tPaths = [];
let tLives = [], idxLife = 0;



// Etape 1 - Création Application
const app = new PIXI.Application({
    width:wST,
    height:hST,
    backgroundColor:0x33CCFF
});
// Etape 2 - Ajout de la vue générée par l'appli dans le DOM
document.body.appendChild(app.view);

// Etape 3 - Chargement des actifs externes
const loader = PIXI.Loader.shared;
// Ajoute des fichiers à charger
loader.add('mySpriteSheet', 'assets/flappy_bird.json');
// Lance le chargement
loader.load( (loader, resources) => {
    // Les données sont chargées
    textures = resources.mySpriteSheet.textures;
    // Initialise les éléments graphiques
    init();
    //testGrid();
    //draw();
});

/*
let path = new PIXI.Graphics();
path.lineStyle(3, 0xFF0000);
app.stage.addChild(path);
let prev = {x:0, y:0}
let next = {x:0, y:0}
function draw(){
    path.lineStyle(Math.random() * 3 + 1, Math.random() * 0x0000FF)
    path.moveTo(prev.x, prev.y);
    next.x = Math.random() * wST
    next.y = Math.random() * hST
    path.lineTo(next.x, next.y);
    prev = next
    requestAnimationFrame(draw);
}
*/
function testGrid(){
    let tEnnemis = [];

    for(let i = 0 ; i < 30 ; i++){
        //console.log(i, "x:", i % 6, (i % 6) * 60, "y:", Math.floor(i / 6));
        let b = new PIXI.Sprite(textures['bird0.png'])
        b.x = 50 + (i % 6) * 60;
        b.y = 50 + Math.floor(i / 6) * 60;
        app.stage.addChild(b);  
        tEnnemis.push(b);      
    }

    //console.log(tEnnemis)
    //tEnnemis[0].alpha = 0.5
    //tEnnemis[5].scale.set(0.5);

    for(let [i, ennemi] of tEnnemis.entries()){
        if(i%2 === 0) ennemi.rotation = Math.PI * 0.5;
        else ennemi.rotation = Math.PI * -0.5;
    }
}


// Initialisation de l'ensemble des éléments
function init(){
    createBg();
    createPipe();
    createGround();
    app.stage.addChild(ctrPaths);

    createBird();
    createGetReady();
    createGameOver();
    createLives()

    // Event
    window.addEventListener('keydown', function(e){
        if(e.keyCode === 32){
            if(phaseJeu === 2){
                phaseJeu = 0;
                idxLife = 0;
                vY = 0;

                pipe.x = wST + pipe.width * 0.5;

                app.stage.removeChild(gameOver);
                app.stage.addChildAt(pipe, 1);
                app.stage.addChild(getReady);
                for(let b of tLives) b.alpha = 1;
            }
            else if(phaseJeu === 0){
                app.stage.removeChild(getReady);
                phaseJeu = 1;
            }
            else {
                vY = impulsion;
            }
        }
    })

    // Animation / Gameloop
    app.ticker.add(() => {
        if(phaseJeu < 2){
            // Déplace le sol
            ground.x -= vX;
            if(ground.x < -120) ground.x = 0;
        }

        // Si ecran acccueil
        if(phaseJeu == 0){
            bird.y = hST / 2 + Math.sin(angle) * amplitude;
            angle += 0.05;
        }
        // Si Ecran jeu
        else if(phaseJeu == 1){
            // Déplace les tuyaux
            pipe.x -= vX;
            if(pipe.x < -pipe.width * 0.5){
                pipe.x = wST + pipe.width * 0.5;
                pipe.y = hST * 0.5 + rdm(-200, 200);
                vX += 0.5;
            }

            bird.y += vY;
            bird.rotation = vY * 0.05;
            vY += acc;

            // Bloque l'oiseau pas de sortie par le haut
            if(bird.y <= bird.height * 0.5){
                bird.y = bird.height * 0.5 + 1;
                vY = 0;
            }
            else if(
                // Collision sol
                bird.y + bird.height * 0.5 >= ground.y
                // Collision oiseau tuyau haut
                || collide(bird.getBounds(), rTop.getBounds())
                // Collision oiseau tuyau bas
                || collide(bird.getBounds(), rBottom.getBounds())
            ){
                if(++idxLife >= tLives.length){
                    phaseJeu = 2;
                    app.stage.addChild(gameOver);
                    app.stage.removeChild(pipe);
                    app.stage.removeChild(ctrPaths);
                    bird.y = hST * 0.5;
                    bird.rotation = 0;
                    tLives[idxLife - 1].alpha = 0.3;
                }
                else {
                    tLives[idxLife - 1].alpha = 0.3;
                    bird.y = hST * 0.5;
                    vY = 0;
                }
                pipe.x = wST + pipe.width * 0.5;
            }
            
            
            // Suivi de l'oiseau
            addTrackPath();
            for(let i = tPaths.length - 1, t ; i >= 0 ; i--){
                t = tPaths[i];
                if(t.x < 2){
                    tPaths.splice(i, 1);
                    ctrPaths.removeChild(t);
                }
                else {
                    t.x -= vX
                    t.alpha -= 0.02;
                }
            }
            
        }
    });
}

// Création arrière-plan
function createBg(){
    let bg = new PIXI.Sprite(textures['background.png']);
    app.stage.addChild(bg);
}
// Création du sol
function createGround(){
    ground = new PIXI.Sprite(textures['ground.png']);
    ground.y = hST - ground.height * 0.7;
    app.stage.addChild(ground);
}
// Création des tuyaux
function createPipe(){
    pipe = new PIXI.Sprite(textures['pipe.png']);
    pipe.anchor.set(0.5);
    pipe.x = wST + pipe.width * 0.5;
    pipe.y = hST / 2;
    app.stage.addChild(pipe);

    rTop = new PIXI.Graphics();
    rTop.x = -45;
    rTop.y = -571;
    rTop.beginFill(0, 0.5);
    rTop.drawRect(0, 0, 90, 484);
    pipe.addChild(rTop);

    rBottom = new PIXI.Graphics();
    rBottom.x = -45;
    rBottom.y = 87;
    rBottom.beginFill(0, 0.5);
    rBottom.drawRect(0, 0, 90, 484);
    pipe.addChild(rBottom);
}
// Création de l'oiseau
function createBird(){
    bird = new PIXI.AnimatedSprite([
        textures['bird0.png'],
        textures['bird1.png'],
        textures['bird2.png'],
        textures['bird3.png']
    ]);
    app.stage.addChild(bird);
    bird.x = wST * 0.3;
    bird.y = hST / 2;
    bird.anchor.set(0.5);  
    bird.animationSpeed = 0.25;
    bird.play();  
}
// Création des getReady
function createGetReady(){
    getReady = new PIXI.Sprite(textures['get_ready.png']);
    getReady.anchor.set(0.5);
    getReady.x = wST * 0.5;
    getReady.y = hST * 0.5;
    app.stage.addChild(getReady);
}
// Création des getReady
function createGameOver(){
    gameOver = new PIXI.Sprite(textures['game_over.png']);
    gameOver.anchor.set(0.5);
    gameOver.x = wST * 0.5;
    gameOver.y = hST * 0.5;
    //app.stage.addChild(gameOver);
}

function createLives(){
    for(var i = 0 ; i < 5 ; i++){
        let b = new PIXI.Sprite(textures['bird0.png']);
        b.scale.set(0.4);
        b.x = wST - (i + 1) * (b.width + 5) - 10;
        b.y = hST - 25;
        app.stage.addChild(b);
        tLives.push(b);
    }
}


function addTrackPath(){
    let p = new PIXI.Graphics();
    p.x = bird.x;
    p.y = bird.y;
    p.beginFill(0xFFFFFF);
    p.drawCircle(0, 0, 2);
    ctrPaths.addChild(p);
    tPaths.push(p)
}

function rdm(x, y){
    return x + Math.random() * (y - x);
}


function collide(r1, r2){
    return !(
        r1.x + r1.width < r2.x || 
        r2.x + r2.width < r1.x || 
        r1.y + r1.height < r2.y || 
        r2.y + r2.height < r1.y
    )
}
