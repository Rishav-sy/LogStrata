import os
import math
from PIL import Image, ImageDraw

def generate_shader_gif():
    # Slide dimensions ratio is 13.333 : 7.5. Let's make the GIF 960x540.
    width, height = 960, 540
    num_frames = 30
    spacing_x = 40
    spacing_y = 90
    speed_y = 3
    
    # Colors
    cyan = (80, 227, 194)       # #50E3C2
    emerald = (16, 185, 129)    # #10B981
    bg_color = (0, 0, 0)        # Pure black background
    
    frames = []
    
    for f in range(num_frames):
        # Create a new black image
        img = Image.new("RGB", (width, height), bg_color)
        draw = ImageDraw.Draw(img)
        
        y_offset = (f * speed_y) % spacing_y
        
        # Draw grid
        for x in range(0, width + spacing_x, spacing_x):
            for y in range(-spacing_y, height + spacing_y, spacing_y):
                curr_y = y + y_offset
                
                # Calculate distance from center for radial mask
                dx = x - (width / 2)
                dy = curr_y - (height / 2)
                dist = math.sqrt(dx*dx + dy*dy)
                max_dist = math.sqrt((width/2)**2 + (height/2)**2)
                
                # Radial falloff (opacity from 0.0 to 1.0)
                opacity = max(0.0, 1.0 - (dist / (max_dist * 0.85)))
                
                # Apply mask to make it look like a nice spotlight shader
                if opacity <= 0:
                    continue
                
                # Determine dot color based on position
                # Alternating cyan and emerald elements
                if (x // spacing_x) % 2 == 0:
                    base_color = cyan
                else:
                    base_color = emerald
                
                r = int(base_color[0] * opacity)
                g = int(base_color[1] * opacity)
                b = int(base_color[2] * opacity)
                color = (r, g, b)
                
                # Draw vertical capsule (light streak) similar to the web shader
                capsule_h = 16
                draw.rectangle(
                    [x - 1, curr_y - capsule_h/2, x + 1, curr_y + capsule_h/2],
                    fill=color
                )
                
                # Draw small auxiliary dots between capsules
                aux_y = curr_y + spacing_y / 2
                dy_aux = aux_y - (height / 2)
                dist_aux = math.sqrt(dx*dx + dy_aux*dy_aux)
                opacity_aux = max(0.0, 1.0 - (dist_aux / (max_dist * 0.85)))
                
                if opacity_aux > 0:
                    r_aux = int(base_color[0] * opacity_aux * 0.5) # Dimmer auxiliary dots
                    g_aux = int(base_color[1] * opacity_aux * 0.5)
                    b_aux = int(base_color[2] * opacity_aux * 0.5)
                    draw.ellipse(
                        [x - 1, aux_y - 1, x + 1, aux_y + 1],
                        fill=(r_aux, g_aux, b_aux)
                    )
        
        frames.append(img)
        
    # Save as animated GIF
    output_path = "/home/rv/Desktop/Projects/Work/8th/LogStrata/shader_bg.gif"
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=40, # 40ms per frame = 25fps
        loop=0 # Infinite loop
    )
    print(f"Animated shader background saved to: {output_path}")

if __name__ == '__main__':
    generate_shader_gif()
