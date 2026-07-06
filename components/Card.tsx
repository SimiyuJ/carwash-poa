type CardProps = {
  title: string;
  value: string | number;
};

export default function Card(props: CardProps) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <p className="text-sm text-gray-500">{props.title}</p>
      <h2 className="text-xl font-bold">{props.value}</h2>
    </div>
  );
}