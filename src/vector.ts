

export class Vector {

    public x : number;
    public y : number;


    constructor(x : number = 0.0, y : number = 0.0) {
		
		this.x = x;
        this.y = y;
	}

	
	public get length() : number {

		return Math.hypot(this.x, this.y); 
	}
	
	
	public clone = () : Vector => new Vector(this.x, this.y); 


	public zeros() : void {

        this.x = 0;
        this.y = 0;
	}

    
    static normalize(v : Vector, forceUnit : boolean = false) : Vector {

        const EPS : number = 0.0001;		
		const len : number = this.length;

        const u : Vector = v.clone();

		if (len < EPS) {
			
            u.zeros();
			u.x = forceUnit ? 1 : 0;

			return u;
		}
		
		u.x /= len;
		u.y /= len;

        return u;
    }
}
