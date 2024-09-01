import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  token: string;

  @Column()
  userid: number;

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;
}
