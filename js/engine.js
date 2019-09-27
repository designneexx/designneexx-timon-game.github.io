function debounce(fn, ms) {
  let isCoolDown = false;

  return function () {
    if (isCoolDown) return;

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

function generateZoneX(esn) {
  const zone = esn.x + randomWithin(-window.innerWidth / 3, window.innerWidth / 3);
  return zone <= 0 ? 10 : zone;
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

function createAnimGameState(el, newVal, oldVal) {
  // const currVal = el.innerHTML.replace()
}

form.addEventListener("submit", e => {
  e.preventDefault();

  const value = username.value.trim();

  if(value !== "") {
    screens.style.transform = "translateX(-100%)";
    game.start();
  }
});

username.addEventListener("keyup", ({ target }) => {
  const value = target.value.trim();

  if(value !== "") {
    startBtn.removeAttribute("disabled");
  } else {
    startBtn.setAttribute("disabled", "");
  }
});

openTutor.addEventListener("click", e => {
  e.preventDefault();
  e.stopPropagation();

  modal.classList.add("active");
});

closeModal.addEventListener("click", e => {
  modal.classList.remove("active");
});

class BaseEssence {
  x = 0;
  y = 0;
  el = document.createElement("div");
  isDeath = false;

  constructor() {
    this.el.classList.add("essence");
    camera.appendChild(this.el);
  }

  get width() {
    return this.el.offsetWidth;
  }

  get height() {
    return this.el.offsetHeight;
  }

  removeAnims() {
    this.el.classList.remove("anim", "walk-a", "idle-a", "attack-a", "death-a");
  }

  addAnim(anim) {
    this.el.classList.add(anim);
  }

  destroy() {
    this.addAnim("death-a");

    this.el.addEventListener("animationend", () => {
      this.isDeath = true;
      window.dispatchEvent(new CustomEvent("death", {
        detail: this
      }));
      this.el.remove();
    });
  }

  updateElem() {
    this.el.style.left = `${this.x}px`;
  }

  pause() {
    this.el.classList.add("paused");
  }

  resume() {
    this.el.classList.remove("paused");
  }

  get position() {
    const { x, y, el } = this;

    const self = this;

    return {
      x,
      y,
      get width() {
        return self.width;
      },
      get height() {
        return self.height;
      },
      el,
      get endX() {
        return this.x + this.width;
      },
      get endY() {
        return this.y + this.height;
      },
    };
  }
}

class Essence extends BaseEssence {
  speed = 0;

  move(direction) {
    this.walkAnim();

    this.x += this.speed * direction;

    this.updateElem();
  }

  idleAnim() {
    this.addAnim("idle-a");
  }

  walkAnim() {
    this.addAnim("walk-a");
  }

  deathAnim() {
    this.addAnim("death-a");
  }

  attackAnim() {
    this.addAnim("attack-a");
  }

  addTransition(anim = "bottom") {
    this.el.style.transition = `${anim} .5s ease`;
  }

  removeTransition() {
    this.el.style.transition = "";
  }

}

class Camera {
  y = 0;
  el = camera;

  constructor(x, speed) {
    this.x = x;
    this.speed = speed;
  }

  translate(direction) {
    this.x += this.speed * direction;

    this.update();
  }

  update() {
    this.el.style.transform = `translateX(-${this.x}px)`;
  }
}

class Player extends  Essence {
  jumpStrong = 590;
  #hp = 100;
  #isHide = false;
  air = Promise.resolve();
  hidden = Promise.resolve();
  y = 0;
  speed = 9;

  jump = debounce(() => this.createJump(), 1600);

  constructor() {
    super();

    this.el.classList.add("player");

    this.el.insertAdjacentHTML("beforeEnd", `
      <div class="state-info">You</div>
    `);

    this.camera = new Camera(this.x, this.speed);

    this.hpElem = document.querySelector(".game-states.hp");
  }

  move(direction) {
    if(this.x + this.speed * direction >= this.camera.el.offsetWidth - this.width) {
      this.x = this.camera.el.offsetWidth - this.width;
      this.updateElem();
      return;
    } if(this.x + this.speed * direction <= 0) {
      this.x = 0;
      this.updateElem();
      return;
    }

    if (this.x + this.speed * direction >= window.innerWidth / 2 - this.width / 2 || this.camera.x > 0) {
      if(this.camera.x + this.camera.speed * direction >= this.camera.el.offsetWidth - window.innerWidth) {
        this.camera.x = this.camera.el.offsetWidth - window.innerWidth;
        this.camera.update();
      } else {
        if(this.x + this.speed * direction <= this.camera.el.offsetWidth - window.innerWidth / 2 - this.width / 2) {
          this.camera.translate(direction);
          this.x = this.camera.x + window.innerWidth / 2 - this.width / 2;
          this.updateElem();
        }
      }
    }

    if(this.x + this.speed * direction >= this.camera.el.offsetWidth - window.innerWidth / 2 - this.width / 2 || this.camera.x <= 0) {
      super.move(direction);
    }

  }

  createJump() {
    this.air = new Promise(fly => {
      this.y += this.jumpStrong;
      this.addTransition();
      this.el.style.bottom = `${this.y}px`;

      const jumpEvt = ({ target }) => {
        this.removeTransition();

        setTimeout(fly, 150);

        target.removeEventListener("transitionend", jumpEvt);
      };

      this.el.addEventListener("transitionend", jumpEvt);
    });
  }

  async checkFly(walls = []) {
    await this.air;

    const playerDownTo = (wpos) => {
      this.y = wpos ? wpos.endY : 90;


      this.addTransition();

      this.el.style.bottom = `${this.y}px`;

      this.el.addEventListener("transitionend", playerDownEvt);
    };
    const playerDownEvt = ({ target }) => {
      this.removeTransition();

      target.removeEventListener("transitionend", playerDownEvt);
    };

    const wall = walls.find(wall => {
      const wpos = wall.position;

      return getTouchPointX(this.position, wpos) && this.y >= wpos.endY;
    });

    if(wall) {
      playerDownTo(wall.position);
      return wall.caterpillar.regen(this);
    } else {
      playerDownTo();
    }

    return false;
  }

  wallMountedWalking(direction, walls = []) {
    const currPos = this.position;
    const wall = walls.find(wall => {
      const wallPos = wall.position;

      return getDiffPoint(currPos, wallPos) <= this.speed;
    });

    if(wall && this.y < wall.position.endY) {
      const wallPos = wall.position;
      const diffPoint = getDiffPoint(currPos, wallPos);
      const currentClone = { ...currPos };

      currentClone.x += this.speed * direction;

      const diffPointSpeed = getDiffPoint(currentClone, wallPos);

      if(diffPoint <= 0 && diffPointSpeed <= 0) return;

      if(diffPoint > 0 && diffPointSpeed <= 0) {
        this.x += diffPoint * direction;
        this.updateElem();
      } else {
        this.move(direction);
      }

    } else {
      this.move(direction);
    }
  }

  get hp() {
    return this.#hp;
  }

  set hp(v) {
    if(v <= 0) {
      this.#hp = 0;
    } else {
      this.#hp = v;
    }

    this.hpElem.innerHTML = v;

    return this.#hp;
  }

  get hide() {
    return this.#isHide;
  }

  set hide(v) {
    this.#isHide = v;

    this.hidden = v ? new Promise(_ => {}) : Promise.resolve();

    this.addTransition("opacity");

    this.el.style.opacity = v ? "0": "1";

    return this.#hp;
  }

}

class Mob extends Essence {
  attack = debounce((esn) => this.createAttack(esn), 1000);

  constructor(speed, damage, radiusDamage, radiusSpy) {
    super();

    this.el.classList.add("mob");
    this.el.insertAdjacentHTML("beforeEnd", `
      <div class="state-info danger">Danger</div>
    `);

    this.speed = speed;
    this.damage = damage;
    this.radiusDamage = radiusDamage;
    this.radiusSpy = radiusSpy;
  }


  createAttack(esn) {
    const animEvt = () => {
      esn.hp -= this.damage;
      this.el.removeEventListener("animationend", animEvt);
    };
    this.el.addEventListener("animationend", animEvt);
  }

  spy(esn) {
    const currPos = this.position;
    const esnPos = esn.position;
    const diffPoint = getDiffPoint(esnPos, currPos);

    if(this.x <= esn.x && diffPoint >= this.radiusSpy) {
      return;
    } else if(this.x >= esn.x && diffPoint + this.width >= this.radiusSpy) {
      return;
    }

    if(diffPoint <= this.radiusDamage) {
      this.attack(esn);
    } else if(this.x < esn.x) {
      this.move(1);
    } else {
      this.move(-1);
    }
  }
}

class Hyena extends Mob {
  constructor(x, y = 0) {
    super(2, 15, 50, 500);

    this.x = x;
    this.y = y;

    this.el.classList.add("hyena");

    this.updateElem();
  }
}

class Hill extends BaseEssence {
  constructor(heath) {
    super();

    this.health = heath;

    this.el.classList.add("hill");
    this.el.insertAdjacentHTML("beforeEnd", `
      <div class="state-info hill">Hill</div>
    `);
  }

  regen(esn) {
    if(this.isDeath) return false;
    const currPos = this.position;
    const esnPos = esn.position;

    if(getTouchPointX(currPos, esnPos) && esn.y === currPos.y) {
      esn.hp += this.health;
      this.destroy();
      this.isDeath = true;

      return true;
    }

    return false;
  }
}

class Caterpillar extends Hill {
  constructor(x, y) {
    super(10);

    this.x = x;
    this.y = y;

    this.el.classList.add("caterpillar");

    this.el.style.bottom = `${this.y}px`;

    this.updateElem();
  }
}

class Wall extends BaseEssence {
  constructor(x, y = 90) {
    super();
    this.x = x;
    this.y = y;
    this.el.classList.add("wall");

    const position = this.position;

    this.caterpillar = new Caterpillar(this.x + this.width / 2, position.endY);
    //
    // this.el.insertAdjacentElement("beforeEnd", this.caterpillar.el);

    this.updateElem();
  }

  pause() {
    super.pause();
    this.caterpillar.el.classList.add("paused");
  }

  resume() {
    super.resume();
    this.caterpillar.el.classList.remove("paused");
  }
}

class Game {
  #isFirstGame = true;
  #isPause = false;
  #isStarted = false;
  #isGaming = false;
  #isLose = false;
  timer = 0;
  caterpillarEats = 0;
  player = new Player();
  walls = [];
  hyenas = [];
  frames = 0;

  constructor() {
    window.addEventListener("death", ({ detail }) => {
      if(detail instanceof Hyena) {
        this.hyenas.splice(this.hyenas.findIndex(hyena => hyena === detail), 1);
      }
      if(detail instanceof Caterpillar) {
        const wall = this.walls.find(wall => wall.caterpillar === detail);
        wall.caterpillar = null;
      }
      if(detail instanceof Wall) {
        this.walls.splice(this.walls.findIndex(wall => wall === detail), 1);
      }
      if(detail instanceof Player) {

      }
    });
  }

  bindEvents() {
    window.addEventListener("keypress", e => this.keyboardEvt(e));
    window.addEventListener("keydown", e => this.keyboardEvt(e));
  }

  async keyboardEvt(e) {
    await this.player.hidden;

    const key = e.key.trim().toLowerCase();

    if(key === "a" || key === "arrowleft") {
      this.player.wallMountedWalking(-1, this.walls);
    } else if(key === "d" || key === "arrowright") {
      this.player.wallMountedWalking(1, this.walls);
    } else if(key === "" || key === "w" || key === "arrowup") {
      this.player.jump();
    } else if(key === "s" || key === "arrowdown") {
      this.player.hide = !this.player.hide;
    }
  }

  async checkCaterpillars () {
    const isEats = await this.player.checkFly(this.walls);
    if(isEats) {
      this.caterpillarEats++;
    }
  }

  engine() {
    let step = () => {
      if(this.#isPause || this.#isLose || !this.#isGaming || !this.#isStarted) return false;



      if(this.frames % 6435345340 === 0) {
        this.timer++;
      }

      if(this.frames % 83453453450 === 0) {
        this.walls.push(new Wall(generateZoneX(this.player)));
        this.hyenas.push(new Hyena(generateZoneX(this.player)));
      }

      this.checkCaterpillars();

      this.hyenas.forEach(hyena => {
        hyena.spy(this.player);
      });

      this.frames++;

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  start() {
    this.#isPause = false;
    this.#isLose = false;
    this.#isGaming = true;
    this.#isStarted = true;

    this.bindEvents();
    this.engine();
  }

  pause() {
    this.#isPause = true;
    this.allEssences.forEach(esn => esn.pause());
  }

  resume() {
    this.#isPause = false;
    this.allEssences.forEach(esn => esn.resume());
    this.engine();
  }

  get allEssences() {
    return [...this.walls, ...this.hyenas];
  }
}

const game = new Game();