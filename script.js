const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// تهيئة Firebase
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAgv4ga8tVfSjo-t_i4s6QrWMKwtLE5B1w",
  authDomain: "wqty-dfc7b.firebaseapp.com",
  projectId: "wqty-dfc7b",
  storageBucket: "wqty-dfc7b.appspot.com",
  messagingSenderId: "445541680133",
  appId: "1:445541680133:web:0a6a3368f222542e1a886c",
  measurementId: "G-9Y6TSRVLC9"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// تعريف اللاعبين
const playerId = 'player1'; // يمكنك تغيير هذا لكل لاعب فريد
let playerX = 50;
let playerY = 50;
let player1, player2, bullets, maze;

// دالة لحفظ حالة اللاعب في قاعدة البيانات
function savePlayerState(playerId, x, y) {
  set(ref(database, 'players/' + playerId), {
    x: x,
    y: y
  });
}

// دالة للاستماع إلى تحديثات اللاعبين من قاعدة البيانات
function listenForPlayerUpdates(callback) {
  const playersRef = ref(database, 'players/');
  onValue(playersRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
}

// إعداد اللعبة
function init() {
    player1 = { x: 50, y: 50, color: 'blue', lives: 5, direction: 'right' };
    player2 = { x: 700, y: 500, color: 'red', lives: 5, direction: 'left' };
    bullets = [];
    maze = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

    requestAnimationFrame(gameLoop);
}

// رسم المتاهة
function drawMaze() {
    for (let row = 0; row < maze.length; row++) {
        for (let col = 0; col < maze[row].length; col++) {
            if (maze[row][col] === 1) {
                ctx.fillStyle = 'gray';
                ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
            }
        }
    }
}

// رسم اللاعبين
function drawPlayer(player) {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, playerSize, playerSize);
}

// التعامل مع الأزرار
let keys = {};

window.addEventListener('keydown', function(e) {
    keys[e.code] = true;
});

window.addEventListener('keyup', function(e) {
    keys[e.code] = false;
});

// تحريك اللاعبين
function movePlayers() {
    if (keys['ArrowUp'] && canMove(player1.x, player1.y - 5)) {
        player1.y -= 5;
        player1.direction = 'up';
    }
    if (keys['ArrowDown'] && canMove(player1.x, player1.y + 5)) {
        player1.y += 5;
        player1.direction = 'down';
    }
    if (keys['ArrowLeft'] && canMove(player1.x - 5, player1.y)) {
        player1.x -= 5;
        player1.direction = 'left';
    }
    if (keys['ArrowRight'] && canMove(player1.x + 5, player1.y)) {
        player1.x += 5;
        player1.direction = 'right';
    }

    if (keys['KeyW'] && canMove(player2.x, player2.y - 5)) {
        player2.y -= 5;
        player2.direction = 'up';
    }
    if (keys['KeyS'] && canMove(player2.x, player2.y + 5)) {
        player2.y += 5;
        player2.direction = 'down';
    }
    if (keys['KeyA'] && canMove(player2.x - 5, player2.y)) {
        player2.x -= 5;
        player2.direction = 'left';
    }
    if (keys['KeyD'] && canMove(player2.x + 5, player2.y)) {
        player2.x += 5;
        player2.direction = 'right';
    }

    // حفظ حالة اللاعبين في Firebase
    savePlayerState('player1', player1.x, player1.y);
    savePlayerState('player2', player2.x, player2.y);
}

// التحقق من إمكانية حركة اللاعبين
function canMove(x, y) {
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    if (maze[row] && maze[row][col] === 0) {
        return true;
    }
    return false;
}

// إطلاق النار
function shoot(player) {
    let dx = 0, dy = 0;
    switch (player.direction) {
        case 'up': dy = -5; break;
        case 'down': dy = 5; break;
        case 'left': dx = -5; break;
        case 'right': dx = 5; break;
    }
    const bullet = {
        x: player.x + playerSize / 2 - 2.5,
        y: player.y + playerSize / 2 - 2.5,
        dx: dx,
        dy: dy,
        color: player.color
    };
    bullets.push(bullet);
    console.log('Bullet created:', bullet); // رسالة التحقق
}

document.getElementById('shoot1').addEventListener('click', () => {
    console.log('Shoot P1'); // رسالة التحقق
    shoot(player1);
});

document.getElementById('shoot2').addEventListener('click', () => {
    console.log('Shoot P2'); // رسالة التحقق
    shoot(player2);
});

// إضافة دعم لأزرار اللمس
document.getElementById('up').addEventListener('touchstart', () => { keys['ArrowUp'] = true; });
document.getElementById('up').addEventListener('touchend', () => { keys['ArrowUp'] = false; });

document.getElementById('down').addEventListener('touchstart', () => { keys['ArrowDown'] = true; });
document.getElementById('down').addEventListener('touchend', () => { keys['ArrowDown'] = false; });

document.getElementById('left').addEventListener('touchstart', () => { keys['ArrowLeft'] = true; });
document.getElementById('left').addEventListener('touchend', () => { keys['ArrowLeft'] = false; });

document.getElementById('right').addEventListener('touchstart', () => { keys['ArrowRight'] = true; });
document.getElementById('right').addEventListener('touchend', () => { keys['ArrowRight'] = false; });

// تحديث الرصاصات
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1); // إزالة الرصاصة إذا خرجت عن حدود الشاشة
        }
    }
}

// رسم الرصاصات
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, 5, 5);
    });
}

// حلقة اللعبة الرئيسية
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze();
    movePlayers();
    updateBullets();
    drawBullets();
    drawPlayer(player1);
    drawPlayer(player2);

    requestAnimationFrame(gameLoop);
}

// بدء اللعبة
init();

// الاستماع لتحديثات اللاعبين الآخرين من Firebase
listenForPlayerUpdates((players) => {
    if (players) {
        player1.x = players.player1 ? players.player1.x : player1.x;
        player1.y = players.player1 ? players.player1.y : player1.y;
        player2.x = players.player2 ? players.player2.x : player2.x;
        player2.y = players.player2 ? players.player2.y : player2.y;
    }
});
