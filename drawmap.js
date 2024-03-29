export function DrawMap(id) {
    this.mSVG = document.getElementById(id);
    this.isDrawing = false;
    this.mode = "rect";
    this.action = "add";
    this.objects = new Map();
    this.n = 0;
    this.active = 0;
    this.activepoint = -1;
    this.SVGwidth = 1000;
    this.r = 9;

    this.x = 0;
    this.y = 0;
    this.buferImage = new Image();
    this.image = document.createElementNS('http://www.w3.org/2000/svg', 'image'); //new Image();
    this.input = document.createElement("input");
    this.input.setAttribute("type", "file");

    //load image
    this.loadImage = function () {

        this.input.click()
    }

    this.input.onchange = (ev) => {
        const file = ev.target.files[0]; // get the file

        if (!file)
            return;

        const blobURL = URL.createObjectURL(file);
        this.buferImage.src = blobURL;
        this.image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', blobURL);
        this.fileurl = file.name;

    }

    this.setsize = () => {
        let winnerWidth = document.getElementById("main_block").clientWidth;
        let w = Math.min(this.w, winnerWidth * 0.9);
        this.mSVG.setAttribute("width", `${w}px`);
        return w;
    }
    window.addEventListener('resize', () => {
        this.setsize();
    }, true);


    this.buferImage.addEventListener("load", (e) => {

        this.mSVG.innerHTML = "";
        this.w = this.buferImage.width;
        this.h = this.buferImage.height;
        this.image.style.width = `${this.w}px`;
        let vb = `0 0 ${this.w} ${this.h}`;
        this.mSVG.setAttribute("viewBox", vb);

        this.SVGwidth = this.setsize();

        this.mSVG.appendChild(this.image);
        //init svg
        this.isDrawing = false;
        this.mode = "rect";
        this.action = "add";
        this.objects = new Map();
        this.n = 0;
        this.active = 0;
        this.activepoint = -1;

        if (this.onLoad)
            this.onLoad();

    });


    this.add = (x, y) => {
        this.n += 1;
        if (this.active > 0)
            this.deactivate(this.active);
        this.active = this.n;
        let p = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        p.setAttribute("cx", x);
        p.setAttribute("cy", y);
        p.setAttribute("z", 1);
        p.setAttribute("r", this.r * this.w / this.SVGwidth);
        p.setAttribute("class", "image-mapper-point");
        p.setAttribute("data-index", this.active);
        p.setAttribute("data-point", 0);
        let obj = {
            ftype: this.mode,
            points: [{ x: x, y: y }],
            circles: [p]
        }

        if (this.mode == "polygon") {
            //create polygon
            let poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            poly.setAttribute("class", "image-mapper-shape");
            poly.setAttribute("data-index", this.active);
            obj.element = poly;

            let poi = this.mSVG.createSVGPoint();
            poi.x = x;
            poi.y = y;
            //obj.polygon = [poi];
            poly.points.appendItem(poi);
            this.mSVG.appendChild(poly);

        }

        this.objects.set(this.active, obj);
        this.action = "edit"
        this.mSVG.appendChild(p);
    }

    this.edit = (x, y) => {
        let obj = this.objects.get(this.active);
        if (!obj) {
            return;
        }

        let p = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        p.setAttribute("cx", x);
        p.setAttribute("cy", y);
        p.setAttribute("z", 1);
        p.setAttribute("r", this.r * this.w / this.SVGwidth);
        p.setAttribute("class", "image-mapper-point");
        p.setAttribute("data-index", this.active);
        p.setAttribute("data-point", obj.points.length);
        obj.points.push({ x: x, y: y })
        obj.circles.push(p);
        this.mSVG.appendChild(p);

        let ftype = obj.ftype;
        if (ftype == "rect") {
            this.createRect(obj);
            this.action = "add";
        }
        if (ftype == "circle") {
            this.createCircle(obj);
            this.action = "add";
        }

        if (ftype == "polygon") {
            //cycle shift
            let n = obj.points.length;
            let last = n-2;
            for (let i = 0; i < obj.circles.length; i++) {
                if (obj.circles[i].getAttribute("class") == "image-mapper-activepoint") {
                    last = i;
                    break;
                }
            }
            if (last!=n-2)
            {
                let shift = new Array(n);
                for (let i = 0; i < n-1; i++)
                {
                    let j = (i+last+1)%(n-1);
                    shift[i] = {x:obj.points[j].x, y:obj.points[j].y};
                }
                for (let i = 0; i < n-1; i++)
                {
                    obj.circles[i].setAttribute("cx", shift[i].x);
                    obj.circles[i].setAttribute("cy", shift[i].y);
                    obj.points[i].x = shift[i].x;
                    obj.points[i].y = shift[i].y;
                }
            }
            this.createPolygon(obj);
            //this.action = "add";
        }

        this.activate(this.active);
        if (ftype == "polygon")
        { 
            let n = obj.points.length;
            this.activatePoint(obj, n-1);
        }
    };

    this.deactivate = (active) => {
        let obj = this.objects.get(active);
        if (!obj)
            return
        for (let i = 0; i < obj.circles.length; i++) {
            obj.circles[i].setAttribute("class", "hide-point");
        }
        if (!obj.element)
            return;
        obj.element.classList.remove("selected");
        if (this.onDeactive)
            this.onDeactive(obj);

    }

    this.activatePoint = (obj, point) => {
        for (let i = 0; i < obj.circles.length; i++) {
            obj.circles[i].setAttribute("class", "image-mapper-point");
        }
        obj.circles[point].setAttribute("class", "image-mapper-activepoint");
    }

    this.activate = (active) => {
        let obj = this.objects.get(active);
        if (!obj)
            return
        for (let i = 0; i < obj.circles.length; i++) {
            obj.circles[i].setAttribute("class", "image-mapper-point");
        }
        if (!obj.element)
            return;
        obj.element.classList.add("selected");



        if (this.onActive)
            this.onActive(obj);
    }


    this.removePreview = () => {
        if (this.preview)
            this.mSVG.removeChild(this.preview);
        this.preview = null;
    }
    this.addPreview = (p) => {
        this.preview = p;
        this.mSVG.appendChild(this.preview);
    }
    this.showPreview = (x, y) => {
        let obj = this.objects.get(this.active);
        if (!obj)
            return;
        if (obj.ftype == "rect")
            this.showPreviewRect(obj, x, y);
        if (obj.ftype == "circle")
            this.showPreviewCircle(obj, x, y);
        if (obj.ftype == "polygon")
            this.showPreviewPolygon(obj, x, y);

    }

    this.showPreviewCircle = (obj, x, y) => {
        let r = (obj.points[0].x - x) * (obj.points[0].x - x) +
            (obj.points[0].y - y) * (obj.points[0].y - y);
        r = Math.sqrt(r);
        let p = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        p.setAttribute("cx", obj.points[0].x);
        p.setAttribute("cy", obj.points[0].y);
        p.setAttribute("r", r);
        p.setAttribute("class", "image-mapper-shape selected");
        this.removePreview();
        this.addPreview(p);
    }

    this.showPreviewPolygon = (obj, x, y) => {
        let p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        p.setAttribute("class", "image-mapper-shape selected");
        let n = obj.points.length;
        let start = n-1;
        for (let i = 0; i < obj.circles.length; i++) {
            if (obj.circles[i].getAttribute("class") == "image-mapper-activepoint") {
                start = i;
                break;
            }
        }
        let stop = (start + 1) % n;    
        let points = [obj.points[start], { x: x, y: y }, obj.points[stop]];
        for (let e of points) {
            let poi = this.mSVG.createSVGPoint();
            poi.x = e.x;
            poi.y = e.y;
            p.points.appendItem(poi);
        }
        this.removePreview();
        this.addPreview(p);
    }


    this.showPreviewRect = (obj, xx, yy) => {
        let x1 = Math.min(obj.points[0].x, xx);
        let x2 = Math.max(obj.points[0].x, xx);
        let y1 = Math.min(obj.points[0].y, yy);
        let y2 = Math.max(obj.points[0].y, yy);
        let p = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        p.setAttribute("x", x1);
        p.setAttribute("y", y1);
        p.setAttribute("width", (x2 - x1));
        p.setAttribute("height", (y2 - y1));
        p.setAttribute("class", "image-mapper-shape selected");
        this.removePreview();
        this.addPreview(p);

    }

    this.createRect = (obj) => {
        let x1 = Math.min(obj.points[0].x, obj.points[1].x);
        let x2 = Math.max(obj.points[0].x, obj.points[1].x);
        let y1 = Math.min(obj.points[0].y, obj.points[1].y);
        let y2 = Math.max(obj.points[0].y, obj.points[1].y);
        let p = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        p.setAttribute("x", x1);
        p.setAttribute("y", y1);
        p.setAttribute("width", (x2 - x1));
        p.setAttribute("height", (y2 - y1));
        p.setAttribute("class", "image-mapper-shape");
        p.setAttribute("data-index", this.active);
        obj.element = p;
        this.mSVG.appendChild(p);
        this.mSVG.appendChild(obj.circles[0]);
        this.mSVG.appendChild(obj.circles[1]);

    }

    this.createCircle = (obj) => {
        let x = obj.points[0].x;
        let y = obj.points[0].y;
        let r = (obj.points[0].x - obj.points[1].x) * (obj.points[0].x - obj.points[1].x) +
            (obj.points[0].y - obj.points[1].y) * (obj.points[0].y - obj.points[1].y);
        r = Math.sqrt(r);
        let p = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        p.setAttribute("cx", x);
        p.setAttribute("cy", y);
        p.setAttribute("r", r);
        p.setAttribute("class", "image-mapper-shape");
        p.setAttribute("data-index", this.active);
        obj.element = p;
        this.mSVG.appendChild(p);
        this.mSVG.appendChild(obj.circles[0]);
        this.mSVG.appendChild(obj.circles[1]);
    }

    this.createPolygon = (obj) => {
        //let n = obj.points.length;
        obj.element.points.clear();
        for (let e of obj.points)
        {
            let poi = this.mSVG.createSVGPoint();    
            poi.x = e.x;
            poi.y = e.y;
            obj.element.points.appendItem(poi);
        }
        /*
        let poi = this.mSVG.createSVGPoint();
        poi.x = obj.points[n - 1].x;
        poi.y = obj.points[n - 1].y;
        obj.element.points.appendItem(poi);
        */
    }


    this.move = (active, point, dx, dy) => {
        let obj = this.objects.get(active);
        if (point == -1)
            for (let i = 0; i < obj.points.length; i++) {
                obj.points[i].x += dx;
                obj.points[i].y += dy;
            }
        else {
            obj.points[point].x += dx;
            obj.points[point].y += dy;
        }
    }
    this.render = (active) => {
        let obj = this.objects.get(active);
        if (!obj)
            return;
        for (let i = 0; i < obj.circles.length; i++) {
            let a = obj.circles[i];
            let x = obj.points[i].x;
            let y = obj.points[i].y;
            a.setAttribute("cx", x);
            a.setAttribute("cy", y);
        }
        let ftype = obj.ftype;
        if (ftype == "rect") {
            this.renderRect(obj);
        }
        if (ftype == "circle") {
            this.renderCircle(obj);
        }
        if (ftype == "polygon") {
            this.renderPolygon(obj);
        }


    };
    this.renderRect = (obj) => {
        if (obj.points.length < 2)
            return;
        let x1 = Math.min(obj.points[0].x, obj.points[1].x);
        let x2 = Math.max(obj.points[0].x, obj.points[1].x);
        let y1 = Math.min(obj.points[0].y, obj.points[1].y);
        let y2 = Math.max(obj.points[0].y, obj.points[1].y);
        let p = obj.element;
        p.setAttribute("x", x1);
        p.setAttribute("y", y1);
        p.setAttribute("width", (x2 - x1));
        p.setAttribute("height", (y2 - y1));

    }

    this.renderCircle = (obj) => {
        if (obj.points.length < 2)
            return;
        let x = obj.points[0].x;
        let y = obj.points[0].y;
        let r = (obj.points[0].x - obj.points[1].x) * (obj.points[0].x - obj.points[1].x) +
            (obj.points[0].y - obj.points[1].y) * (obj.points[0].y - obj.points[1].y);
        r = Math.sqrt(r);
        let p = obj.element;
        p.setAttribute("cx", x);
        p.setAttribute("cy", y);
        p.setAttribute("r", r);
    }


    this.renderPolygon = (obj) => {
        for (let i = 0; i < obj.points.length; i++) {
            obj.element.points[i].x = obj.points[i].x;
            obj.element.points[i].y = obj.points[i].y;
        }
    };

    this.click = (x, y) => {
        if (this.action == "add")
            this.add(x, y);
        else
            this.edit(x, y);
    }


    this.delete = () => {
        this.removePreview();
        let obj = this.objects.get(this.active);
        if (obj.ftype == "polygon") {
            for (let i = 0; i < obj.circles.length; i++) {
                if (obj.circles[i].getAttribute("class") == "image-mapper-activepoint") {

                    this.mSVG.removeChild(obj.circles[i]);
                    obj.circles.splice(i, 1);
                    obj.points.splice(i, 1);
                    //obj.polygon.splice(i,1);
                    obj.element.points.clear();
                    for (let j = 0; j < obj.circles.length; j++) {
                        obj.circles[j].setAttribute("data-point", j);
                        let poi = this.mSVG.createSVGPoint();
                        poi.x = obj.points[j].x;
                        poi.y = obj.points[j].y;
                        obj.element.points.appendItem(poi);
                    }

                    return;
                }
            }
        }
        this.active = 0;
        this.action = "add";
        if (!obj)
            return
        obj.deleted = true;
        for (let i = 0; i < obj.circles.length; i++) {
            this.mSVG.removeChild(obj.circles[i])
        }
        if (!obj.element)
            return;
        this.mSVG.removeChild(obj.element)
    }

    this.scale = (x) => {
        return ((x * this.w) / this.mSVG.width.baseVal.value);
    }




    this.generate2 = () => {
        let result = `<!-- Image Map Generated by https://www.fla-shop.com/image-map/ -->
<img src="${this.fileurl}" usemap="#image-map">
<map name="image-map">`;

        for (let i = 0; i < this.mSVG.children.length; i++) {
            if (this.mSVG.children[i].classList.contains("image-mapper-shape")) {
                let ix = parseInt(this.mSVG.children[i].dataset.index);
                let obj = this.objects.get(ix);
                if (!obj)
                    continue;
                let text = (obj.text) ? obj.text : "";
                let url = (obj.url) ? obj.url : "#";
                let target = (obj.target) ? obj.target : "";
                if (target == "---")
                    target = "";
                let shape = "";
                let coords = "";
                let ftype = obj.ftype;
                if (ftype == "rect") {
                    shape = "rect";
                    coords = `${Math.round(obj.points[0].x)},${Math.round(obj.points[0].y)},${Math.round(obj.points[1].x)},${Math.round(obj.points[1].y)}`;
                }
                if (ftype == "circle") {
                    shape = "circle";
                    let x = parseInt(obj.element.getAttribute("cx"));
                    let y = parseInt(obj.element.getAttribute("cy"));
                    let r = parseInt(obj.element.getAttribute("r"));
                    coords = `${x},${y},${r}`;
                }
                if (ftype == "polygon") {
                    shape = "poly"
                    coords = `${Math.round(obj.points[0].x)},${Math.round(obj.points[0].y)}`;
                    for (let i = 1; i < obj.points.length; i++)
                        coords = coords + `,${Math.round(obj.points[i].x)},${Math.round(obj.points[i].y)}`;
                }


                let area = `    <area target="${target}" alt="${text}" title="${text}" href="${url}" coords="${coords}" shape="${shape}"></area>`;
                result = result + "\n" + area
            }
        }
        result = result + "\n</map>";
        return result;
    }

    this.generate = () => {

        let stylestr = `
<style>
.image-mapper-shape {
    fill: rgba(0, 0, 0, 0);
}
g:hover .image-mapper-shape {
    stroke: white;
    stroke-width: 4;
    stroke-opacity: .5;
}
.image-text {
    font-family: Verdana;
    font-size: 22px;
    fill: rgba(0, 0, 0, 0);
}

g:hover .image-text {
    fill: white;
}
</style>
        `

        //let swidth = ` width = "${this.w}" `;
        //if (this.w > 1200)
        let swidth = ` style="width:100%" `;
        let vb = this.mSVG.getAttribute("viewBox");
        let stsvg = `<svg ${swidth} xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${vb}">`;
        stsvg += `<!-- Image Map Generated by https://www.fla-shop.com/image-map/ -->`
        let result = stsvg + stylestr;

        let simg = this.image.outerHTML;
        let re = /href="(.*?)"/i;
        let newhref = `href="${this.fileurl}"`;
        simg = simg.replace(re, newhref);
        result = result + "\n" + simg;

        for (let i = 0; i < this.mSVG.children.length; i++) {
            if (this.mSVG.children[i].classList.contains("image-mapper-shape")) {
                let ix = parseInt(this.mSVG.children[i].dataset.index);
                let obj = this.objects.get(ix);
                if (!obj)
                    continue;
                let text = (obj.text) ? obj.text : "";
                let url = (obj.url) ? obj.url : "#";
                let target = (obj.target) ? obj.target : "";

                let astr = `<a xlink:href="${url}" target="${target}" xlink:title="${text}">`
                result = result + "\n" + astr;

                result = result + "\n<g>";
                result = result + "\n" + this.mSVG.children[i].outerHTML;

                //let txttag = `<text class="image-text" x="${obj.points[0].x}" y="${obj.points[0].y}">${text}</text>`;
                //result = result + "\n" + txttag;

                result = result + "\n</g>";
                result = result + "\n" + "</a>";
            }
        }
        result = result + "\n" + "</svg>";
        return result;
    }


    window.addEventListener("mouseup", (e) => {
        if (this.isDrawing) {
            this.x = 0;
            this.y = 0;
            this.isDrawing = false;
            if (this.active > 0) {
                let obj = this.objects.get(this.active)
                if (!obj.element)
                    return;
                obj.element.classList.remove("image-move");
            }

        }
    });

    this.mSVG.addEventListener("mousedown", (e) => {


        this.x = this.scale(e.offsetX);
        this.y = this.scale(e.offsetY);

        this.removePreview();

        if (e.target.dataset.index) {
            let active = parseInt(e.target.dataset.index);
            let point = -1;
            if (e.target.dataset.point != null)
                point = parseInt(e.target.dataset.point);


            this.action = "add";
            if (active != this.active) {
                this.deactivate(this.active)
                this.active = active;
                this.activate(this.active);
            }
            this.active = active;
            let obj = this.objects.get(this.active);
            if (obj.ftype == "polygon") {
                this.action = "edit";
            }
            else
                this.action == "add";


            if (e.target.dataset.point != null) {
                this.activepoint = point;
                if (obj.ftype == "polygon")
                    this.activatePoint(obj, point);
            }
            else {
                e.target.classList.add("image-move");
                this.activepoint = -1;
            }
            this.isDrawing = true;

        }
        else {
            this.click(this.x, this.y);
        }
    });
    this.mSVG.addEventListener("dblclick", (e) => {
        if (this.active > 0)
        {
            this.deactivate(this.active);
            this.active = 0;
            this.removePreview();
        }
        this.action = "add";
    }
    );
    this.mSVG.addEventListener("mousemove", (e) => {
        if (this.isDrawing) {
            this.move(this.active, this.activepoint, this.scale(e.offsetX) - this.x, this.scale(e.offsetY) - this.y);
            this.x = this.scale(e.offsetX);
            this.y = this.scale(e.offsetY);
            this.render(this.active);
        } else {

            if (this.action == "edit" && this.active > 0) {
                let x = this.scale(e.offsetX);
                let y = this.scale(e.offsetY);
                if (e.target.dataset.index || e.target.dataset.point)
                    this.removePreview();
                else    
                    this.showPreview(x, y);
            }



        }

    });

    this.mSVG.addEventListener("touchmove", (e) => {
        if (!this.isDrawing)
            return

        if (this.active_to == 0)
            return;

        e.preventDefault();
        const touches = e.changedTouches;
        this.move(this.active_to, this.activepoint_to, this.scale(touches[0].pageX) - this.x, this.scale(touches[0].pageY) - this.y);
        this.x = this.scale(touches[0].pageX);
        this.y = this.scale(touches[0].pageY);
        this.render(this.active_to);

    });

    this.mSVG.addEventListener("touchstart", (e) => {
        if (e.target.dataset.index == null) {
            this.active_to = 0;
            this.activepoint_to = -1;
            return;
        }
        this.active_to = parseInt(e.target.dataset.index);
        if (e.target.dataset.point == null)
            this.activepoint_to = -1;
        else
            this.activepoint_to = parseInt(e.target.dataset.point);
        this.isDrawing = true;
        const touches = e.changedTouches;
        this.x = this.scale(touches[0].pageX);
        this.y = this.scale(touches[0].pageY);
        //console.log(e.target);
        //this.render(this.active);
    });

    this.mSVG.addEventListener("touchend", (e) => {
        if (this.isDrawing) {
            this.active_to = 0;
            this.activepoint_to = -1;
            this.x = 0;
            this.y = 0;
            this.isDrawing = false;
        }
    });



}