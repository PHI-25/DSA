import matplotlib.pyplot as plt
import matplotlib.animation as animation
import heapq
import numpy as np

# --- Graph Data ---
# Define the graph structure using an adjacency list.
# Each entry is a list of tuples (neighbor, weight).
graph = {
    0: [(1, 6), (2, 1)],
    1: [(0, 6), (3, 1), (5, 8)],
    2: [(0, 1), (4, 3)],
    3: [(1, 1), (5, 5)],
    4: [(2, 3), (5, 4), (7, 3)],
    5: [(1, 8), (3, 5), (4, 4), (6, 5)],
    6: [(5, 5), (7, 4)],
    7: [(4, 3), (6, 4)]
}

# Define the fixed positions for each node to match the video's layout
node_positions = {
    0: (500, 100),
    1: (200, 200),
    2: (800, 200),
    3: (200, 400),
    4: (800, 400),
    5: (500, 500),
    6: (200, 600),
    7: (800, 600)
}

# Scale positions for better visualization
scale_factor = 0.0015
for node in node_positions:
    node_positions[node] = (
        node_positions[node][0] * scale_factor,
        node_positions[node][1] * scale_factor
    )

# --- Dijkstra's Algorithm with Step Recording ---
def dijkstra_with_steps(graph, start_node):
    """
    Implements Dijkstra's algorithm and records each step for animation.
    """
    distances = {node: float('infinity') for node in graph}
    distances[start_node] = 0
    priority_queue = [(0, start_node)]
    visited_nodes = set()
    
    # This list will store the state of the algorithm at each step
    animation_steps = []

    while priority_queue:
        current_distance, current_node = heapq.heappop(priority_queue)

        if current_node in visited_nodes:
            continue
        
        visited_nodes.add(current_node)
        
        # Record the current state: node being visited, distances
        step_info = {
            'visited_node': current_node,
            'visited_path': None,
            'distances': dict(distances),
            'visited_nodes_set': set(visited_nodes)
        }
        animation_steps.append(step_info)

        for neighbor, weight in graph[current_node]:
            if neighbor not in visited_nodes:
                distance = current_distance + weight
                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    heapq.heappush(priority_queue, (distance, neighbor))
                    
                    # Record the edge relaxation step
                    edge_step_info = {
                        'visited_node': current_node,
                        'visited_path': (current_node, neighbor),
                        'distances': dict(distances),
                        'visited_nodes_set': set(visited_nodes)
                    }
                    animation_steps.append(edge_step_info)

    return distances, animation_steps

# --- Matplotlib Visualization and Animation ---
def animate_dijkstra(animation_steps, final_distances):
    """
    Creates and animates the graph based on the recorded steps.
    """
    fig, ax = plt.subplots(figsize=(10, 8))
    ax.set_aspect('equal', adjustable='box')
    plt.title("Dijkstra's Algorithm Visualization")
    plt.axis('off')
    
    # Set a custom background color
    fig.patch.set_facecolor('#f0f4f8')
    ax.set_facecolor('#f7fafc')

    nodes = list(graph.keys())
    node_labels = {node: str(node) for node in nodes}

    def draw_graph(step_info, is_final_frame):
        ax.clear()
        ax.set_aspect('equal', adjustable='box')
        plt.title("Dijkstra's Algorithm Visualization")
        plt.axis('off')

        # Get current state from step_info
        current_distances = step_info['distances']
        visited_nodes_set = step_info['visited_nodes_set']
        visited_path = step_info['visited_path']
        highlighted_node = step_info['visited_node']

        # Draw edges
        for u, neighbors in graph.items():
            for v, weight in neighbors:
                x1, y1 = node_positions[u]
                x2, y2 = node_positions[v]
                edge_color = 'gray'
                line_width = 1.5

                if visited_path and ((u,v) == visited_path or (v,u) == visited_path):
                    edge_color = 'red'
                    line_width = 3

                ax.plot([x1, x2], [y1, y2], color=edge_color, linewidth=line_width, zorder=1)
                ax.text((x1 + x2) / 2, (y1 + y2) / 2, str(weight), ha='center', va='center', fontsize=10, color='black')

        # Draw nodes and labels
        for node in nodes:
            x, y = node_positions[node]
            node_color = 'white'
            edge_color = 'blue'
            
            if node in visited_nodes_set:
                node_color = '#4caf50'  # Green for visited
            
            if node == highlighted_node:
                edge_color = 'red'
                
            ax.add_patch(plt.Circle((x, y), radius=0.03, color=node_color, ec=edge_color, linewidth=2, zorder=2))
            ax.text(x, y, node_labels[node], ha='center', va='center', fontsize=12, color='black', zorder=3)
            
            # Display current distance
            if current_distances[node] != float('infinity'):
                ax.text(x, y + 0.04, f'd={current_distances[node]}', ha='center', va='center', fontsize=8, color='black')

        # Add the table on the final frame
        if is_final_frame:
            table_data = []
            for vertex, distance in sorted(final_distances.items()):
                distance_str = str(distance) if distance != float('infinity') else "infinity"
                table_data.append([vertex, distance_str])

            headers = ["Vertex", "Distance"]
            table = ax.table(cellText=table_data, colLabels=headers, loc='bottom', bbox=[0.25, -0.25, 0.5, 0.2])
            table.auto_set_font_size(False)
            table.set_fontsize(10)
            table.scale(1.2, 1.2)


    def update(frame_index):
        is_final_frame = frame_index == len(animation_steps) - 1
        if frame_index < len(animation_steps):
            draw_graph(animation_steps[frame_index], is_final_frame)

    # Generate animation
    anim = animation.FuncAnimation(fig, update, frames=len(animation_steps), interval=500, repeat=False)
    
    plt.show()

    # --- How to save the animation ---
    # The following code requires a writer like 'ffmpeg' or 'imagemagick'.
    # You may need to install them separately.
    # To save as a video (requires ffmpeg):
    # anim.save('dijkstra_animation.mp4', writer='ffmpeg', fps=2)
    
    # To save as a GIF (requires imagemagick):
    # anim.save('dijkstra_animation.gif', writer='imagemagick', fps=2)
    # The `fps` parameter controls the speed of the animation.
    print("Animation complete. Use the provided code to save it as a video or GIF.")


if __name__ == '__main__':
    start_node = 0
    final_distances, animation_steps = dijkstra_with_steps(graph, start_node)
    animate_dijkstra(animation_steps, final_distances)