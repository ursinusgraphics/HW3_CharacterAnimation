const POINT_COLORS = ["#ff0000", "#ff00ff", "#0000ff", "#00aa00"];

class Kinematics2D {
    constructor() {
        this.Ps = []; //Points [a, b, c, d] on the arm
        this.target = glMatrix.vec3.create(); // Target
        let canvas = document.getElementById('segcanvas');
        let ctx = canvas.getContext("2d"); //For drawing
        ctx.font = "16px Arial";
        this.ctx = ctx;
        //Need this to disable that annoying menu that pops up on right click
        canvas.addEventListener("contextmenu", function(e){ e.stopPropagation(); e.preventDefault(); return false; }); 
        this.canvas = canvas;
    }
    
    /**
     * Redraw arm based on positions
     */
    repaint() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const dW = 5;
        const W = canvas.width;
        const H = canvas.height;
        const p = this.target;
        const Ps = this.Ps;
        ctx.clearRect(0, 0, W, H);
    
        if (!(p === null)) {
            //Draw target
            let dWP = dW*2;
            ctx.fillStyle = 'black';
            let dist = glMatrix.vec3.dist(p, Ps[Ps.length-1]);
            if (dist < 5) {
                dWP = dW*2.5;
                ctx.fillStyle = 'red';
            }
            ctx.fillRect(p[0]-dWP, H-(p[1]+dWP), dWP*2+1, dWP*2+1);
        }
        
        //Draw joints
        for (let i = 0; i < Ps.length; i++) {
            ctx.fillStyle = POINT_COLORS[i%POINT_COLORS.length];
            let dWi = dW;
            if (i == 0) {
                dWi *= 1.5;
            }
            ctx.fillRect(Ps[i][0]-dWi, H-(Ps[i][1]+dWi), dWi*2+1, dWi*2+1);
        }
        
        //Draw body
        ctx.fillStyle = "#000000";
        for (let i = 0; i < Ps.length-1; i++) {
            ctx.beginPath();
            ctx.moveTo(Ps[i][0], H-Ps[i][1]);
            ctx.lineTo(Ps[(i+1)%Ps.length][0], H-Ps[(i+1)%Ps.length][1]);
            ctx.stroke();
        }
    }
}

/**
 * Class for a forward kinematics demo with 3 arms in 2D
 */
class ForwardKinematics2D extends Kinematics2D {
    /**
     * 
     * @param {list of float} lengths List of lengths of the 3 arms
     */
    constructor(lengths) {
        super();
        this.lengths = lengths;
        this.angles = glMatrix.vec3.create();
        document.getElementById("p0x_2").value = 0;
        document.getElementById("p0y_2").value = 0;
        for (let k = 0; k < 3; k++) {
            document.getElementById("angle"+(k+1)).value = 0;
        }
        this.updateArm();
    }

    /**
     * Update positions of arm joints based on lengths and angles
     */
    updateArm() {
        // Read out target
        const p = this.target;
        const angles = this.angles;
        const lengths = this.lengths;
        p[0] = parseFloat(document.getElementById("p0x_2").value);
        p[1] = parseFloat(document.getElementById("p0y_2").value);
        // Read out angles
        for (let k = 0; k < 3; k++) {
            angles[k] = Math.PI*parseFloat(document.getElementById("angle"+(k+1)).value)/180;
        }
        this.Ps = [glMatrix.vec3.fromValues(10, 300, 0)];
        const Ps = this.Ps;
        let angle = 0;
        for (let k = 0; k < 3; k++) {
            angle += angles[k];
            let pk = glMatrix.vec3.create();
            glMatrix.vec3.copy(pk, Ps[Ps.length-1]);
            let dir = glMatrix.vec3.fromValues(Math.cos(angle), Math.sin(angle), 0);
            glMatrix.vec3.scaleAndAdd(pk, pk, dir, lengths[k]);
            Ps.push(pk);
        }
        this.repaint();
    }
}

/**
 * A class for testing the FABRIK algorithm in 2D
 */
class Fabrik2DTester extends Kinematics2D {
    constructor() {
        super();
        this.selectingArm = true;
        this.armButton = document.getElementById("selectArm");
        this.targetButton = document.getElementById("selectTarget");
        this.moveButton = document.getElementById("moveToTarget");
        this.selectArm();
        this.canvas.addEventListener("mousedown", this.selectVec.bind(this));
        this.canvas.addEventListener("touchstart", this.selectVec.bind(this)); //Works on mobile devices!
    }

    selectPoint() {
        this.selectingArm = false;
        this.armButton.style.background = "#bfbfbf";
        this.moveButton.style.background = "#bfbfbf";
        this.targetButton.style.background = "#bb1111";
    }
    
    selectArm() {
        this.selectingArm = true;
        this.armButton.style.background = "#bb1111";
        this.moveButton.style.background = "#bfbfbf";
        this.targetButton.style.background = "#bfbfbf";
    }
    
    moveToTarget() {
        this.armButton.style.background = "#bfbfbf";
        this.moveButton.style.background = "#bb1111";;
        this.targetButton.style.background = "#bfbfbf";
        FABRIKIter(this.Ps, this.target);
        this.repaint();
    }

    getMousePos(evt) {
        let rect = this.canvas.getBoundingClientRect();
        return {
            X: evt.clientX - rect.left,
            Y: evt.clientY - rect.top
        };
    }
    
    selectVec(evt) {
        let mousePos = this.getMousePos(evt);
        let X = mousePos.X;
        let Y = this.canvas.height - mousePos.Y;
        let clickType = "LEFT";
        evt.preventDefault();
        if (evt.which) {
            if (evt.which == 3) clickType = "RIGHT";
            if (evt.which == 2) clickType = "MIDDLE";
        }
        else if (evt.button) {
            if (evt.button == 2) clickType = "RIGHT";
            if (evt.button == 4) clickType = "MIDDLE";
        }
        
        if (this.selectingArm) {
            if (clickType == "LEFT") {
                this.Ps.push(glMatrix.vec3.fromValues(X, Y, 0));
            }
            else {
                //Remove point
                if (this.Ps.length > 0) {
                    this.Ps.pop();
                }
            }
        }
        else {
            this.target = glMatrix.vec3.fromValues(X, Y, 0);
        }
        this.repaint();
    }
}