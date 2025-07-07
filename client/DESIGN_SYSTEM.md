# Jobmarkit Design System 🎨

## Overview

Jobmarkit uses a consistent purple theme throughout the application to create a modern, professional, and cohesive user experience.

## Color Palette

### Primary Colors

- **Purple-600**: `#6B46C1` - Primary purple
- **Purple-700**: `#5B35B1` - Hover purple
- **Purple-500**: `#8B5CF6` - Accent purple
- **Purple-100**: `#F3E8FF` - Light purple background

### Color Combinations

```css
/* Primary Color */
bg-[#6B46C1]

/* Hover Color */
hover:bg-purple-700

/* Text Color */
.text-purple-600

/* Background Colors */
.bg-purple-50
.bg-purple-100
```

## Components

### Buttons

Use the `Button` component for consistent styling:

```jsx
import Button from './components/ui/Button';

// Primary button (default)
<Button>Apply Now</Button>

// Secondary button
<Button variant="secondary">Learn More</Button>

// Outline button
<Button variant="outline">Cancel</Button>

// Loading state
<Button loading>Processing...</Button>
```

### Badges

Use the `Badge` component for consistent badge styling:

```jsx
import Badge from './components/ui/Badge';

// Default badge
<Badge>New</Badge>

// Primary purple badge
<Badge variant="primary">Featured</Badge>

// Color variants
<Badge variant="secondary">Purple</Badge>
<Badge variant="blue">Blue</Badge>
```

## CSS Classes

### Utility Classes

```css
/* Purple backgrounds */
.bg-[#6B46C1]
.bg-purple-50
.bg-purple-100

/* Text colors */
.text-purple-600
.text-purple-700

/* Border colors */
.border-purple-200
.border-purple-300

/* Button styles */
.btn-primary
.btn-secondary

/* Input styles */
.input-primary

/* Card styles */
.card-primary
.card-gradient

/* Navigation styles */
.nav-link
.nav-link-active

/* Section headers */
.section-header;
```

## Implementation Guidelines

### 1. Buttons

- Always use the `Button` component for consistency
- Primary actions: Use `variant="primary"` (purple)
- Secondary actions: Use `variant="secondary"` (gray border)
- Destructive actions: Use `variant="danger"` (red)

### 2. Badges & Tags

- Use `Badge` component for all badges and tags
- Job types: Use `variant="secondary"` (purple)
- Locations: Use `variant="blue"` (blue)
- Status indicators: Use appropriate color variants

### 3. Forms

- Input fields: Use `input-primary` class
- Focus states: Always use `focus:ring-purple-500`
- Validation: Use green for success, red for errors

### 4. Cards & Containers

- Job cards: Use `card-primary` class
- Featured sections: Use `card-gradient` for subtle purple background
- Hover effects: Use consistent shadow and border transitions

### 5. Navigation

- Active links: Use `nav-link-active` class
- Hover states: Use `nav-link` class
- Brand elements: Use purple styling

## Examples

### Job Card Styling

```jsx
<div className="card-primary">
  <Badge variant="secondary">Full-time</Badge>
  <Badge variant="blue">Freetown</Badge>
  <Button variant="primary">Apply Now</Button>
</div>
```

### Form Styling

```jsx
<form>
  <input className="input-primary" placeholder="Job title" />
  <Button type="submit" variant="primary">
    Search Jobs
  </Button>
</form>
```

### Navigation Styling

```jsx
<nav>
  <a className="nav-link">Home</a>
  <a className="nav-link-active">Jobs</a>
  <Button variant="primary">Get Started</Button>
</nav>
```

## Accessibility

### Focus States

- All interactive elements must have visible focus states
- Use `focus:ring-purple-500` for consistent focus styling
- Ensure sufficient color contrast (4.5:1 minimum)

### Color Usage

- Don't rely solely on color to convey information
- Use icons and text labels alongside colors
- Test with color blindness simulators

## Responsive Design

### Mobile Considerations

- Buttons: Minimum 44px touch target
- Text: Minimum 16px for readability
- Spacing: Use consistent padding and margins

### Breakpoints

```css
/* Mobile first approach */
@media (min-width: 768px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
}

@media (min-width: 1280px) {
  /* Large desktop styles */
}
```

## Purple Theme Benefits

### Professional Appeal

- Purple conveys trust, wisdom, and professionalism
- Perfect for government and corporate presentations
- Creates a sophisticated, modern appearance

### Accessibility

- High contrast ratios for better readability
- Consistent color usage across all components
- Clear visual hierarchy

### Scalability

- Easy to extend with additional purple shades
- Compatible with future dark mode implementation
- Maintains brand consistency across platforms
