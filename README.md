# Momentry

A beautiful, interactive web application for visualizing and tracking your life in weeks. Built with p5.js, Momentry helps you reflect on your memories and set goals for the future, all within the context of your limited time—approximately 4,000 weeks in a lifetime.

## 📋 Project Information

**Student**: Prisa Senduangdeth  
**University**: University of Technology Sydney (UTS)  
**Subject**: Interactive Media  
**Assignment**: Assignment 2

🌐 **Live Site**: [dev.momentry.space](https://dev.momentry.space)

## 🌟 Features

- **Week-Based Visualization**: See your life organized in 52-week grids, one for each year
- **Memory Tracking**: Record and revisit meaningful moments from your weeks
- **Goal Setting**: Set and track future goals with countdown timers
- **Interactive Design**:
  - Hover effects on week circles
  - Smooth animations and transitions
  - Rain particle effects
  - Mouse trail visualization
- **Responsive Layout**: Optimized for both desktop and mobile devices
- **Local Storage**: All your data is saved locally in your browser
- **Audio Experience**: Background music and interactive hover sounds

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server required—runs entirely in the browser

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser
3. That's it! No build process or dependencies to install

**Or visit the live site**: [dev.momentry.space](https://dev.momentry.space)

### First Time Setup

When you first open Momentry, you'll be guided through:

1. An intro sequence with reflective questions
2. Entering your birth date
3. The main visualization interface

## 📁 Project Structure

```
A2/
├── index.html              # Main HTML file
├── README.md               # This file
├── jsconfig.json           # JavaScript configuration
├── CNAME                   # GitHub Pages configuration
│
├── assets/
│   ├── images/
│   │   └── momentry_icon.png
│   └── audio/
│       └── bg_music.mp3         # Background music
│
├── css/
│   └── style.css           # Stylesheet
│
├── js/
│   ├── sketch.js           # Main p5.js sketch (App class)
│   ├── WeekCircle.js        # Week circle visualization
│   ├── StartingPage.js      # Intro sequence
│   ├── ModalManager.js      # Memory/goal entry modal
│   ├── GoalCountdown.js     # Future goals display
│   ├── AudioManager.js      # Audio handling
│   ├── MouseTrail.js        # Mouse trail effect
│   ├── RainParticle.js      # Rain particle system
│   ├── DateUtils.js         # Date calculations
│   └── storage.js           # LocalStorage management
│
└── libraries/
    ├── p5.min.js           # p5.js library
    └── p5.sound.min.js      # p5.js sound library
```

## 🎮 Usage

### Adding Memories

1. Click on any week circle (past or current weeks)
2. Fill in the memory form:
   - Title
   - Date
   - Description
   - Optional image
3. Click "Save"

### Setting Goals

1. Click on a future week circle
2. Fill in the goal form (same as memory form)
3. Goals appear in the "On the horizon..." section with countdown timers

### Viewing and Editing

- Click on a week circle with existing memories to view them
- Click "Edit" to modify a memory
- Click "Delete" to remove a memory
- Use year navigation buttons (← →) to browse different years

### Navigation

- **Home Button**: Return to the current year
- **Music Toggle**: Turn background music on/off
- **Year Navigation**: Move between years

## 🛠️ Technical Details

### Technologies

- **p5.js**: Creative coding and visualization
- **p5.sound**: Audio playback
- **LocalStorage API**: Data persistence
- **Vanilla JavaScript**: No frameworks, pure JS
- **CSS3**: Styling and responsive design

### Performance Optimizations

- Cached DOM elements to reduce queries
- Throttled modal state checks (100ms intervals)
- Touch coordinate caching for mobile devices
- Responsive particle counts (500-2500 based on screen size)
- Efficient hover detection with coordinate passing

### Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Responsive Design

The application adapts to different screen sizes:

- **Mobile (< 600px)**: Smaller circles, optimized particle count (500)
- **Tablet (600-900px)**: Medium circles, medium particle count (1000-1500)
- **Desktop (> 900px)**: Full-size circles, maximum particle count (2000-2500)

## 🎨 Visual Features

- **Week Circles**: Color-coded by state (past, current, future, with memories, goals)
- **Hover Effects**: Darkening and saturation changes on interaction
- **Rain Particles**: Dynamic particle system with umbrella effect
- **Mouse Trail**: Smooth trail following cursor movement
- **Fade Transitions**: Smooth page transitions and year changes

## 💾 Data Storage

All data is stored locally in your browser using the LocalStorage API:

- Memories and goals are saved per year
- Data persists between sessions
- No data is sent to any server
- Your privacy is protected

## 🔧 Development

### File Organization

The project follows a clean structure:

- **Assets**: Images and audio files
- **CSS**: Stylesheets
- **JS**: All JavaScript modules
- **Libraries**: Third-party dependencies

### Key Classes

- `App`: Main application state and logic
- `WeekCircle`: Individual week visualization
- `ModalManager`: Handles memory/goal entry
- `GoalCountdown`: Displays future goals
- `AudioManager`: Manages audio playback
- `StartingPage`: Intro sequence handler

## 📝 License

This project is created for educational purposes as part of a university assignment.

## 🙏 Acknowledgments

- Built with [p5.js](https://p5js.org/)
- Uses [Inter font](https://fonts.google.com/specimen/Inter) from Google Fonts
- Background music: "Hinoki Wood" (original by [Gia Margaret](https://giamargaret.bandcamp.com/)), version by [Paul Drew Music](https://www.youtube.com/watch?v=vnnuLgNXms4)
- Inspired by the concept of "4,000 weeks" from [Oliver Burkeman's book](https://www.oliverburkeman.com/fourthousandweeks)

---

**Momentry** - Your life, one week at a time.
