( () => {

    class Game {
        canvas = document.getElementById( 'canva' );
        ctx = this.canvas.getContext( '2d' );
        w = this.canvas.width = window.innerWidth;
        h = this.canvas.height = window.innerHeight;
        isRunning = true;
        score = 0;
        images = {
            background: null,
            platform: null,
            ball: null,
            block: null
        };
        sounds = {
            bump: null,
        };
        platform = {
            width: 228,
            height: 46,
            x: this.w / 2 - 114,
            y: this.h - this.h * .2,
            velocity: 6,
            dx: 0
        };
        ball = {
            width: 46,
            height: 46,
            started: false,
            x: this.w / 2 - 23,
            y: this.h - this.h * .2 - 46,
            dx: 0,
            dy: 0,
            velocity: 3
        };
        blocks = {
            count: [],
            rows: 4,
            cols: 8
        };

        loadFiles( func ) {
            let loaded = 0;
            let required = Object.keys( this.images ).length;
            required += Object.keys( this.sounds ).length;
            const onLoaded = () => {
                ++loaded;
                if ( loaded >= required ) {
                    func()
                }
            };
            for ( let key in this.images ) {
                this.images[ key ] = new Image();
                this.images[ key ].src = `img/${key}.png`;
                this.images[ key ].addEventListener( 'load', onLoaded )
            }

            for ( let key in this.sounds ) {
                this.sounds[ key ] = new Audio(`./sounds/${key}.mp3`);
                this.sounds[ key ].addEventListener( 'canplaythrough', onLoaded, {once: true} )
            }
        }

        createBlocks() {
            for ( let row = 0; row < this.blocks.rows; row++ ) {
                for ( let col = 0; col < this.blocks.cols; col++ ) {
                    this.blocks.count.push( {
                        active: true,
                        width: 80,
                        height: 40,
                        x: col * ( this.images.block.width + 10 ) + ( this.w / 2 - this.blocks.cols * ( ( this.images.block.width + 10 ) / 2 ) ) + 10,
                        y: Math.floor( this.h * .2 + 50 * row )
                    } )
                }
            }
        }

        drawBlocks() {
            this.blocks.count.forEach( block => {
                if ( block.active ) {
                    this.ctx.drawImage( this.images.block, block.x, block.y )
                }
            } )
        }

        setEvents() {
            window.addEventListener( 'keydown', ( e ) => {
                if ( e.keyCode == 32 ) {
                    if ( !this.ball.started ) {
                        this.ballStart()
                    }
                } else if ( e.keyCode == 37 ) {
                    this.platform.dx = -this.platform.velocity
                } else if ( e.keyCode == 39 ) {
                    this.platform.dx = this.platform.velocity
                }
            } );

            window.addEventListener( 'keyup', ( e ) => {
                if ( e.keyCode == 37 ) {
                    this.platform.dx = 0
                } else if ( e.keyCode == 39 ) {
                    this.platform.dx = 0
                }
            } );

            window.addEventListener( 'resize', () => {
                this.w = this.canvas.width = window.innerWidth;
                this.h = this.canvas.height = window.innerHeight;
            } );
        };

        platformMove() {
            if ( this.platform.dx ) {
                this.platform.x += this.platform.dx;
                if ( !this.ball.started ) {
                    this.ball.x += this.platform.dx
                }
            }

            if ( this.platform.x < 0 ) {
                this.platform.x = 0;
                this.platform.dx = 0
                !this.ball.started ? this.ball.x = this.platform.width / 2 - this.ball.width / 2 : null;
            } else if ( this.platform.x + this.platform.width > this.w ) {
                this.platform.x = this.w - this.platform.width;
                this.platform.dx = 0;
                !this.ball.started ? this.ball.x = this.w - this.platform.width / 2 - this.ball.width / 2 : null;
            }
        }

        random( min, max ) {
            return Math.floor( Math.random() * ( max - min + 1 ) + min )
        }

        ballStart() {
            this.ball.dy -= this.ball.velocity;
            this.ball.started = true;
            this.ball.dx = this.random( -this.ball.velocity, this.ball.velocity )
        }

        ballMove() {
            if ( this.ball.dy ) {
                this.ball.y += this.ball.dy;
                this.ball.x += this.ball.dx
            }
        }

        ballCollide( element ) {
            let x = this.ball.x + this.ball.dx;
            let y = this.ball.y + this.ball.dy;
            if ( x + this.ball.width > element.x &&
                x < element.x + element.width &&
                y + this.ball.height > element.y &&
                y < element.y + element.height
            ) {
                return true
            }
            return false
        }

        ballBumpBlock() {
            this.blocks.count.forEach( block => {
                if ( block.active && this.ballCollide( block ) ) {
                    this.ball.dy *= -1;
                    block.active = false;
                    ++this.score;
                    this.sounds.bump.play();
                    if ( this.score >= this.blocks.rows * this.blocks.cols ) {
                        this.end( 'You won!' )
                    }
                }
            } );
        }

        getTouchOffset( x ) {
            let diff = ( this.platform.x + this.platform.width ) - x;
            let offset = this.platform.width - diff;
            let res = 2 * offset / this.platform.width;
            return res - 1
        };

        ballBumpPlatform() {
            if ( this.ballCollide( this.platform ) ) {
                if ( this.platform.dx ) {
                    this.ball.x += this.platform.dx
                }
                if ( this.ball.dy > 0 ) {
                    this.ball.dy = -this.ball.velocity
                    let touchX = this.ball.x + this.ball.width / 2;
                    this.ball.dx = this.ball.velocity * this.getTouchOffset( touchX )
                }
                this.sounds.bump.play();
            }
        }

        ballBumpScreen() {
            if ( this.ball.x < 0 ) {
                this.ball.x = 0;
                this.ball.dx = this.ball.velocity;
                this.sounds.bump.play();
            } else if ( this.ball.x + this.ball.width > this.w ) {
                this.ball.x = this.w - this.ball.width;
                this.ball.dx = -this.ball.velocity;
                this.sounds.bump.play();
            } else if ( this.ball.y < 0 ) {
                this.ball.y = 0;
                this.ball.dy = this.ball.velocity;
                this.sounds.bump.play();
            } else if ( this.ball.y > this.h ) {
                this.end( 'Game Over' )
            }
        }

        end( message ) {
            this.isRunning = false;
            window.requestAnimationFrame( () => {
                this.ctx.fillStyle = '#d6d6d6';
                this.ctx.font = '40px Arial';
                this.ctx.clearRect( 0, 0, this.w, this.h );
                this.ctx.drawImage( this.images.background, 0, 0 );
                this.ctx.fillText( message, this.w / 2 - 100, this.h / 2);
            } );
            setTimeout( () => {
                window.location.reload()
            }, 3000 )
        }

        scoreText() {
            this.ctx.fillStyle = '#d6d6d6';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`score: ${this.score}`, 50, 50)
        }

        render() {
            this.ctx.clearRect( 0, 0, this.w, this.h );
            this.ctx.drawImage( this.images.background, 0, 0 );
            this.ctx.drawImage( this.images.platform, this.platform.x, this.platform.y );
            this.ctx.drawImage( this.images.ball, this.ball.x, this.ball.y );
            this.drawBlocks();
            this.scoreText();

        }

        init() {
            this.loadFiles( () => {
                this.createBlocks();
                this.render();
                this.run()
            } );
            this.setEvents();
        }

        update() {
            this.ballMove();
            this.platformMove();
            this.ballBumpBlock();
            this.ballBumpPlatform();
            this.ballBumpScreen();
        }

        run() {
            if ( this.isRunning ) {
                window.requestAnimationFrame( () => {
                    this.update();
                    this.render();
                    this.run();
                } )
            }
        }

        start() {
            this.init();
            this.run()
        }
    }

    const game = new Game();
    game.start();

} )();