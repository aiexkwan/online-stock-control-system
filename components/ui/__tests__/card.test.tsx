import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '../card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card with children', () => {
      render(<Card>Card content</Card>);
      const card = screen.getByText('Card content');
      expect(card).toBeInTheDocument();
    });

    it('should have default card classes', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('rounded-xl', 'border', 'bg-card', 'text-card-foreground', 'shadow');
    });

    it('should merge custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-xl'); // Should still have default classes
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should pass through HTML attributes', () => {
      render(<Card data-testid="test-card" id="my-card">Content</Card>);
      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('id', 'my-card');
    });
  });

  describe('CardHeader', () => {
    it('should render header with children', () => {
      render(<CardHeader>Header content</CardHeader>);
      const header = screen.getByText('Header content');
      expect(header).toBeInTheDocument();
    });

    it('should have default header classes', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      const header = container.firstChild;
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('should merge custom className', () => {
      const { container } = render(<CardHeader className="custom-header">Header</CardHeader>);
      const header = container.firstChild;
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('flex'); // Should still have default classes
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref}>Header</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('should render title as h3 element', () => {
      render(<CardTitle>Title text</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Title text');
    });

    it('should have default title classes', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByRole('heading');
      expect(title).toHaveClass('font-semibold', 'leading-none', 'tracking-tight');
    });

    it('should merge custom className', () => {
      render(<CardTitle className="text-xl">Title</CardTitle>);
      const title = screen.getByRole('heading');
      expect(title).toHaveClass('text-xl');
      expect(title).toHaveClass('font-semibold'); // Should still have default classes
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe('CardDescription', () => {
    it('should render description as paragraph', () => {
      render(<CardDescription>Description text</CardDescription>);
      const description = screen.getByText('Description text');
      expect(description.tagName).toBe('P');
    });

    it('should have default description classes', () => {
      render(<CardDescription>Description</CardDescription>);
      const description = screen.getByText('Description');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should merge custom className', () => {
      render(<CardDescription className="italic">Description</CardDescription>);
      const description = screen.getByText('Description');
      expect(description).toHaveClass('italic');
      expect(description).toHaveClass('text-sm'); // Should still have default classes
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<CardDescription ref={ref}>Description</CardDescription>);
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('CardContent', () => {
    it('should render content with children', () => {
      render(<CardContent>Content area</CardContent>);
      const content = screen.getByText('Content area');
      expect(content).toBeInTheDocument();
    });

    it('should have default content classes', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      const content = container.firstChild;
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('should merge custom className', () => {
      const { container } = render(<CardContent className="space-y-4">Content</CardContent>);
      const content = container.firstChild;
      expect(content).toHaveClass('space-y-4');
      expect(content).toHaveClass('p-6'); // Should still have default classes
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter', () => {
    it('should render footer with children', () => {
      render(<CardFooter>Footer content</CardFooter>);
      const footer = screen.getByText('Footer content');
      expect(footer).toBeInTheDocument();
    });

    it('should have default footer classes', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.firstChild;
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('should merge custom className', () => {
      const { container } = render(<CardFooter className="justify-end">Footer</CardFooter>);
      const footer = container.firstChild;
      expect(footer).toHaveClass('justify-end');
      expect(footer).toHaveClass('flex'); // Should still have default classes
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Complete Card Example', () => {
    it('should render a complete card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
      expect(screen.getByText('Card description text')).toBeInTheDocument();
      expect(screen.getByText('Main content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('should maintain proper component hierarchy', () => {
      const { container } = render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle data-testid="title">Title</CardTitle>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
        </Card>
      );

      const card = screen.getByTestId('card');
      const header = screen.getByTestId('header');
      const title = screen.getByTestId('title');
      const content = screen.getByTestId('content');

      expect(card).toContainElement(header);
      expect(card).toContainElement(content);
      expect(header).toContainElement(title);
    });
  });

  describe('Accessibility', () => {
    it('should maintain semantic HTML structure', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Card</CardTitle>
            <CardDescription>This card is accessible</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Content with proper semantics</p>
          </CardContent>
        </Card>
      );

      // Check that heading hierarchy is maintained
      const heading = screen.getByRole('heading');
      expect(heading.tagName).toBe('H3');

      // Check that description is a paragraph
      const description = screen.getByText('This card is accessible');
      expect(description.tagName).toBe('P');
    });
  });
});
