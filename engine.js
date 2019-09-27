function debounce(fn, ms) {
  let isCoolDown = false;

  return function () {
    if(isCoolDown) return false;

    fn.apply(this, arguments);

    isCoolDown = true;

    setTimeout(() => isCoolDown = false, ms);
  }
}

function random(n) {
  return Math.floor(Math.random() * n);
}

function randomWithin(min, max) {
  return random(max - min) + min;
}

function generateZoneX(player) {
  return player.x + randomWithin(-550, 550);
}

function getTouchPoint(a, b) {
  return (a.endX >= b.x && a.x <= b.endX) && (a.endY >= b.y && a.y <= b.endY);
}

function getTouchPointX(a, b) {
  return a.endX >= b.x && a.x <= b.endX;
}


function getDiffPoint(a, b) {
  return Math.abs((a.x + a.width / 2) - (b.x + b.width / 2)) - (a.width / 2 + b.width / 2);
}

class Camera {
  #x = 0;
  #y = 0;

  constructor(x, y, camera) {
    this.#x = x;
    this.#y = y;
    this.el = camera;
  }

  translate() {
    this.el.style.transform = `translate(-${this.x}px, -${this.y}px)`;
  }

  get x() {
    return this.#x;
  }

  set x(value) {
    this.#x = value;

    this.translate();

    return this.#x;
  }

  get y() {
    return this.#y;
  }

  set y(value) {
    this.#y = value;

    this.translate();

    return this.#y;
  }
}

class BaseEssence {
  x = 0;
  y = 0;
  el = document.createElement("div");

  constructor() {
    camera.appendChild(this.el);
    this.el.classList.add("essence");
  }

  get width() {
    return this.el.offsetWidth;
  }

  get height() {
    return this.el.offsetHeight;
  }

  removeAnimations() {
    this.classList.remove("idle-a", "walk-a", "death-a", "attack-a");
  }

  addAnimate(animate) {
    this.classList.add(animate);
  }

  destroy(animate) {
    this.addAnimate(animate);

    this.el.addEventListener("transitionend", () => {
      camera.removeChild(this.el);

      Object.freeze(this);
    });
  }

  updateElem() {
    this.el.style.left = `${this.x}px`;
  }

  get position() {
    const {
      x,
      y,
      width,
      height,
      el
    } = this;

    return {
      x,
      y,
      get endX() {
        return this.x + this.width;
      },
      get endY() {
        return this.y + this.height;
      },
      width,
      height,
      el
    };
  }
}

class Essence extends BaseEssence {
  speed = 0;

  walk(direction) {
    this.walkAnim();

    this.x += this.speed * direction;

    this.updateElem();
  }

  walkAnim() {
    this.el.classList.add("walk-a");
  }

  idleAnim() {
    this.el.classList.add("idle-a");
  }

  deathAnim() {
    this.el.classList.add("death-a");
  }
}

class Player extends Essence {
  speed = 72;
  #hp = 100;
  #hide = false;
  air = Promise.resolve();
  jumpStrong = 290;
  y = 0;

  constructor() {
    super();

    this.el.classList.add("player");
  }

  get hp() {}

  set hp(value) {}

  get hide() {}

  set hide(value) {}

  addTransition() {
    this.el.style.transition = `bottom .8s ease-in-out`;
  }

  removeTransition() {
    this.el.style.transition = "";
  }

  createJump() {
    this.air = new Promise(fly => {
      this.y += this.jumpStrong;
      this.el.style.bottom = `${this.y}px`;
      this.addTransition();

      const jumpEvt = ({ target }) => {
        this.removeTransition();

        setTimeout(fly, 150);

        target.removeEventListener("transitionend", jumpEvt);
      };

      this.el.addEventListener("transitionend", jumpEvt);
    });
  }

  async checkFly(walls) {
    await this.air;

    const playerDownTo = wallPosition => {
      this.y = wallPosition ? wallPosition.endY : 0;

      this.addTransition();

      this.el.style.bottom = `${this.y}px`;

      this.el.addEventListener("transitionend", playerDownEvt);
    };
    const playerDownEvt = ({target}) => {
      this.removeTransition();
      target.removeEventListener("transitionend", playerDownEvt);
    };
    const wall = walls.find(wall => {
      const wallPos = wall.position;

      return getTouchPointX(this.position, wallPos) && this.y >= wallPos.endY;
    });

    if (wall) {
      playerDownTo(wall.position);
    } else {
      playerDownTo();
    }
  }

  wallMountedWalking(direction, walls) {
    const currentPos = this.position;
    const wall = walls.find(wall => {
      const wallPos = wall.position;

      return getDiffPoint(currentPos, wallPos) <= this.speed;
    });

    if(wall && this.y < wall.position.endY) {
      const wallPos = wall.position;
      const diffPoint = getDiffPoint(currentPos, wallPos);
      const currentClone = { ...currentPos };

      currentClone.x += this.speed * direction;

      const diffPointSpeed = getDiffPoint(currentClone, wallPos);

      if(diffPoint <= 0 && diffPointSpeed <= 0) return;

      if(diffPoint > 0 && diffPointSpeed <= 0) {
        this.x += diffPoint * direction;
        this.el.style.left = `${this.x}px`;
      } else {
        this.walk(direction);
      }
    } else {
      this.walk(direction);
    }
  }
}

class Hyena extends Essence {
  speed = 9;
  damage = 15;
  radiusDamage = 50;
  radiusSpy = 500;

  constructor(x, y = 0) {
    super();

    this.x = x;
    this.y = y;

    this.el.classList.add("hyena");

    this.updateElem();
  }

  async attack(player) {
    await this.attackAnim();

    player.hp -= this.damage;
  }

  attackAnim() {
    this.el.classList.add("attack-a");

    return new Promise(attacked => {
      this.el.addEventListener("transitionend", attacked);
    });
  }

  spy(player) {
    const currentPos = this.position;
    const playerPos = player.position;
    const diffPoint = getDiffPoint(playerPos, currentPos);

    if(diffPoint >= this.radiusSpy) return;

    if(diffPoint <= this.radiusDamage) {
      this.attack();
    } else if(this.x < player.x) {
      this.walk(1);
    } else {
      this.walk(-1);
    }
  }
}

class Wall extends BaseEssence {
  constructor(x, y = 0) {
    super();

    this.x = x;
    this.y = y;

    this.el.classList.add("wall");

    this.updateElem();

    setTimeout(() => this.destroy(), 15000);
  }
}

class Caterpillar extends BaseEssence {}

class Game {
  gameStart = true;
  isLose = false;
  frames = 0;
  points = 0;
  timer = 0;
  player = new Player();
  hyenas = [];
  caterpillars = [];
  walls = [];

  constructor() {
    this.camera = new Camera(0, 0, camera);
    this.halfWidth = window.innerWidth / 2 - this.player.width / 2;
    this.bindEvents();
    this.start();
    this.jump = debounce(() => this.player.createJump(), 2000);
  }

  start() {
    const step = () => {
      if(this.frames % 222290 === 0) {
        const hyena = new Hyena(generateZoneX(this.player));

        this.hyenas.push(hyena);
      }

      if(this.frames % 222290 === 0) {
        const wall = new Wall(generateZoneX(this.player));

        this.walls.push(wall);
      }

      this.hyenas.forEach((hyena) => {
        hyena.spy(this.player);
      });

      if(this.frames % 10 === 0) this.player.checkFly(this.walls);

      requestAnimationFrame(step);

      this.frames++;
    };

    requestAnimationFrame(step);
  }

  bindEvents() {
    window.addEventListener("keypress", ({ key }) => {
      const button = key.trim().toLowerCase();

      if(button === "a") {
        this.player.wallMountedWalking(-1, this.walls);

        if(this.player.x >= this.halfWidth && this.player.x <= camera.offsetWidth - window.innerWidth / 2 - this.player.width / 2) this.camera.x -= this.player.speed;

      } else if(button === "d") {
        if(this.player.x <= camera.offsetWidth - this.player.width) {
          this.player.wallMountedWalking(1, this.walls);
        }


        if(this.camera.x <= camera.offsetWidth - window.innerWidth && this.player.x >= this.halfWidth) {
          this.camera.x += this.player.speed;
        }
      }
    });

    window.addEventListener("keyup", ({ key }) => {
      const button = key.trim().toLowerCase();

      if(button === "") {
        this.jump();
      }
    });
  }
}


const camera = document.querySelector("#camera");
const game = new Game();