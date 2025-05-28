## What have we done so far?

So far, we have built an interactive web interface that allows users to craft a runner with different physiological characteristics—age, weight, and height—using intuitive sliders
Once a runner is created, the app dynamically predicts physiological responses, including heart rate (HR), respiration rate (RR), VO₂, VCO₂, and VE. 
These predicted values are visualized numerically and will soon be connected to real-time animations representing breathing, heartbeat, and gas exchange. 
In addition, a histogram provides feedback about how the crafted runner's height compares to the overall dataset, encouraging users to explore how height may correlate with endurance

## What will be the most challenging of your project to design and why?

The hardest part of our project is making the animations and building the prediction model. 
For the animations, it’s tricky to show things like oxygen use or lung ventilation in a way that looks clear and makes sense.
We have to design visual effects like bubbles or moving dots, and also make sure they match the predicted numbers.
It’s also hard to make all the animations run smoothly together without looking messy. 
For the model, training it to give accurate results is challenging because the data can be noisy or uneven. 
We want the predictions to match real physiology while also reacting well to user input. 
Balancing both the visuals and the science will be the most difficult part.
